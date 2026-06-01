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
    month: z.coerce.number().min(0).max(11),
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
        const prevMonthIndex = month === 0 ? 11 : month - 1
        const prevYearIndex = month === 0 ? year - 1 : year

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

                    // Find the payment record for this month and update electricity
                    const monthDate = new Date(year, month, 1)
                    const paymentUpdate = await db.collection("Payment").findOneAndUpdate(
                        {
                            flatId: new ObjectId(flatId),
                            month: monthDate
                        },
                        {
                            $set: {
                                electricityDue: electricityDue,
                                updatedAt: new Date()
                            }
                        },
                        { returnDocument: 'after' }
                    )

                    // Recalculate totalDue and balance for this payment
                    if (paymentUpdate) {
                        const p = paymentUpdate as any
                        const newTotalDue = (p.rentDue || 0) + (p.maintenanceDue || 0) + electricityDue + (p.arrears || 0)
                        const newBalance = newTotalDue - (p.amountPaid || 0)

                        let newStatus = p.status
                        if (newBalance <= 0) newStatus = "PAID"
                        else if ((p.amountPaid || 0) > 0) newStatus = "PARTIAL"
                        else newStatus = "PENDING"

                        await db.collection("Payment").updateOne(
                            { _id: p._id },
                            {
                                $set: {
                                    totalDue: newTotalDue,
                                    balance: Math.max(0, newBalance),
                                    status: newStatus,
                                    updatedAt: new Date()
                                }
                            }
                        )
                    }
                }
            }
        }

        revalidatePath(`/flats/${flatId}`)
        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath('/')
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
