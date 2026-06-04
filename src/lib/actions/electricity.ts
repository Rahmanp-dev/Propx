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

        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year

        const meteredFlats = await prisma.flat.findMany({
            where,
            include: {
                building: {
                    select: { name: true, ratePerUnit: true }
                },
                meterReadings: {
                    where: {
                        OR: [
                            { month, year },
                            { month: prevMonth, year: prevYear }
                        ]
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ]
                },
                tenants: {
                    where: { isActive: true },
                    take: 1
                }
            },
            orderBy: [
                { buildingId: 'asc' },
                { flatNumber: 'asc' }
            ]
        })

        const data = meteredFlats.map(flat => {
            const currentReading = flat.meterReadings.find(r => r.month === month && r.year === year)
            const previousReading = flat.meterReadings.find(r => r.month === prevMonth && r.year === prevYear)
            const activeTenant = flat.tenants[0]
            
            let calcAmount = 0
            if (currentReading && previousReading && !currentReading.isInitial) {
                const units = currentReading.reading - previousReading.reading
                if (units > 0) {
                    calcAmount = units * (flat.building?.ratePerUnit || 10)
                }
            }

            return {
                flatId: flat.id,
                flatNumber: flat.flatNumber,
                buildingName: flat.building?.name || 'N/A',
                tenantName: activeTenant ? activeTenant.fullName : null,
                hasReading: !!currentReading,
                readingValue: currentReading ? currentReading.reading : null,
                readingId: currentReading ? currentReading.id : null,
                pendingAmount: calcAmount,
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
    year: z.number(),
    isInitial: z.boolean().optional().default(false)
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
                    $set: { reading: r.reading, isInitial: r.isInitial || false, readingDate: new Date(), updatedAt: new Date() },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            )

            // Skip bill generation for initial/baseline readings
            if (r.isInitial) {
                continue
            }

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
                        const monthStr = r.month.toString().padStart(2, '0')
                        const startDate = new Date(`${r.year}-${monthStr}-01T00:00:00.000Z`)
                        startDate.setHours(startDate.getHours() - 12)
                        
                        const endDate = new Date(startDate)
                        endDate.setMonth(endDate.getMonth() + 1)

                        const targetPayment = await prisma.payment.findFirst({
                            where: {
                                flatId: r.flatId,
                                month: {
                                    gte: startDate,
                                    lt: endDate
                                }
                            }
                        })

                        if (targetPayment) {
                            // Atomic Pipeline Update for Race Condition prevention
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
        }

        revalidatePath('/', 'layout')
        
        return { success: true }
    } catch (error) {
        console.error("Failed to save meter readings:", error)
        return { error: "Failed to save meter readings" }
    }
}
