'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import clientPromise from "@/lib/mongo"
import { ObjectId } from "mongodb"

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

export async function getElectricityDashboard(month: number, year: number) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where = orgCtx.isSuperAdmin
            ? { electricityType: 'METERED' as const }
            : { electricityType: 'METERED' as const, building: { organizationId: orgCtx.organizationId! } }

        const meteredFlats = await prisma.flat.findMany({
            where,
            include: {
                building: {
                    select: { name: true }
                },
                meterReadings: {
                    where: { month, year },
                    take: 1
                },
                tenants: {
                    where: { isActive: true },
                    take: 1
                },
                payments: {
                    orderBy: { month: 'desc' },
                    take: 1
                }
            },
            orderBy: [
                { buildingId: 'asc' },
                { flatNumber: 'asc' }
            ]
        })

        const data = meteredFlats.map(flat => {
            const currentReading = flat.meterReadings[0]
            const activeTenant = flat.tenants[0]
            const latestPayment = flat.payments[0]
            return {
                flatId: flat.id,
                flatNumber: flat.flatNumber,
                buildingName: flat.building?.name || 'N/A',
                tenantName: activeTenant ? activeTenant.fullName : null,
                hasReading: !!currentReading,
                readingValue: currentReading ? currentReading.reading : null,
                readingId: currentReading ? currentReading.id : null,
                pendingAmount: latestPayment ? latestPayment.balance : 0,
            }
        })

        return { success: true, data }
    } catch (error) {
        console.error("Failed to fetch electricity dashboard:", error)
        return { error: "Failed to fetch electricity dashboard" }
    }
}

const bulkReadingSchema = z.array(z.object({
    flatId: z.string(),
    reading: z.number().min(0),
    month: z.number(),
    year: z.number()
}))

export async function bulkRecordMeterReadings(readings: any[]) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const parsed = bulkReadingSchema.safeParse(readings)
        if (!parsed.success) {
            return { error: "Invalid data format" }
        }

        const validReadings = parsed.data

        // VERIFY FLAT OWNERSHIP (IDOR Patch)
        if (!orgCtx.isSuperAdmin) {
            const flatIds = validReadings.map(r => r.flatId)
            const flats = await prisma.flat.findMany({
                where: { id: { in: flatIds }, building: { organizationId: orgCtx.organizationId! } },
                select: { id: true, building: { select: { ratePerUnit: true } } }
            })
            const validFlatIds = new Set(flats.map(f => f.id))
            for (const r of validReadings) {
                if (!validFlatIds.has(r.flatId)) return { error: "Unauthorized flat ID detected" }
            }
        }

        const client = await clientPromise
        const db = client.db("propx")
        
        for (const r of validReadings) {
            await db.collection("MeterReading").updateOne(
                { flatId: new ObjectId(r.flatId), month: r.month, year: r.year },
                {
                    $set: { reading: r.reading, readingDate: new Date(), updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            )

            // Auto-compute electricity bill if previous month exists
            const prevMonth = r.month === 1 ? 12 : r.month - 1
            const prevYear = r.month === 1 ? r.year - 1 : r.year

            const prevReading = await db.collection("MeterReading").findOne({
                flatId: new ObjectId(r.flatId), month: prevMonth, year: prevYear
            })

            if (prevReading) {
                const unitsConsumed = r.reading - (prevReading as any).reading
                if (unitsConsumed >= 0) {
                    const flat = await prisma.flat.findUnique({
                        where: { id: r.flatId }, include: { building: true }
                    })

                    if (flat) {
                        const rate = flat.building.ratePerUnit || 10
                        const electricityDue = unitsConsumed * rate
                        const monthDate = new Date(r.year, r.month - 1, 1)

                        // Atomic Pipeline Update for Race Condition prevention
                        await db.collection("Payment").updateOne(
                            { flatId: new ObjectId(r.flatId), month: monthDate },
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

        revalidatePath('/dashboard')
        revalidatePath('/[userId]/electricity', 'page')
        revalidatePath('/finance')
        
        return { success: true }
    } catch (error) {
        console.error("Failed to save meter readings:", error)
        return { error: "Failed to save meter readings" }
    }
}
