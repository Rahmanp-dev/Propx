'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

async function getOrgContext() {
    const session = await auth()
    if (!session?.user) return null
    const user = session.user as any
    return {
        userId: user.id,
        role: user.role as string,
        organizationId: user.organizationId as string | null,
        isSuperAdmin: user.role === 'SUPER_ADMIN',
    }
}

const recordReadingSchema = z.object({
    flatId: z.string(),
    reading: z.coerce.number().min(0),
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2024)
})

export type RecordReadingInput = z.infer<typeof recordReadingSchema>

export async function recordMeterReading(data: RecordReadingInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = recordReadingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { flatId, reading, month, year } = result.data

    try {
        // Verify flat belongs to user's org
        if (!orgCtx.isSuperAdmin) {
            const flat = await prisma.flat.findFirst({
                where: { id: flatId, building: { organizationId: orgCtx.organizationId! } }
            })
            if (!flat) return { error: "Flat not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        // 1. Save the meter reading
        await db.collection("MeterReading").updateOne(
            {
                flatId: new ObjectId(flatId),
                month: month,
                year: year
            },
            {
                $set: {
                    reading: reading,
                    readingDate: new Date(),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        )

        // 2. Auto-compute electricity bill
        // Find previous month's reading
        const prevMonthIndex = month === 1 ? 12 : month - 1
        const prevYearIndex = month === 1 ? year - 1 : year

        const prevReading = await db.collection("MeterReading").findOne({
            flatId: new ObjectId(flatId),
            month: prevMonthIndex,
            year: prevYearIndex
        })

        if (prevReading) {
            const unitsConsumed = reading - (prevReading as any).reading
            if (unitsConsumed >= 0) {
                // Get building rate
                const flat = await prisma.flat.findUnique({
                    where: { id: flatId },
                    include: { building: true }
                })

                if (flat) {
                    const rate = flat.building.ratePerUnit || 10
                    const electricityDue = unitsConsumed * rate

                    // Define the month range strictly (matching how Ledger/Rental engine does)
                    const monthStr = month.toString().padStart(2, '0')
                    const startDate = new Date(`${year}-${monthStr}-01T00:00:00.000Z`)
                    startDate.setHours(startDate.getHours() - 12)
                    
                    const endDate = new Date(startDate)
                    endDate.setMonth(endDate.getMonth() + 1)

                    const targetPayment = await prisma.payment.findFirst({
                        where: {
                            flatId: flatId,
                            month: {
                                gte: startDate,
                                lt: endDate
                            }
                        }
                    })

                    if (targetPayment) {
                        await db.collection("Payment").updateOne(
                            { _id: new ObjectId(targetPayment.id) },
                            [
                                {
                                    $set: {
                                        electricityDue: electricityDue,
                                        totalDue: { $add: [{ $ifNull: ["$rentDue", 0] }, { $ifNull: ["$maintenanceDue", 0] }, electricityDue, { $ifNull: ["$customDues", 0] }, { $ifNull: ["$arrears", 0] }] },
                                        updatedAt: new Date()
                                    }
                                },
                                {
                                    $set: {
                                        balance: { $max: [0, { $subtract: ["$totalDue", { $ifNull: ["$amountPaid", 0] }] }] }
                                    }
                                },
                                {
                                    $set: {
                                        status: {
                                            $cond: {
                                                if: { $lte: ["$balance", 0] }, then: "PAID",
                                                else: {
                                                    $cond: {
                                                        if: { $gt: [{ $ifNull: ["$amountPaid", 0] }, 0] }, then: "PARTIAL", else: "PENDING"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        )
                    }
                }
            }
        }

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to record meter reading:", error)
        return { error: `Failed to record meter reading: ${error.message || String(error)}` }
    }
}

export async function getFlatReadings(flatId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Verify flat belongs to user's org
        if (!orgCtx.isSuperAdmin) {
            const flat = await prisma.flat.findFirst({
                where: { id: flatId, building: { organizationId: orgCtx.organizationId! } }
            })
            if (!flat) return { error: "Flat not found" }
        }

        const readings = await prisma.meterReading.findMany({
            where: { flatId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12
        })
        return { success: true, data: readings }
    } catch (error: any) {
        console.error("Failed to fetch readings:", error)
        return { error: `Failed to fetch readings: ${error.message || String(error)}` }
    }
}
