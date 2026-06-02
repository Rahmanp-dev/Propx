'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

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
            return {
                flatId: flat.id,
                flatNumber: flat.flatNumber,
                buildingName: flat.building?.name || 'N/A',
                tenantName: activeTenant ? activeTenant.fullName : null,
                hasReading: !!currentReading,
                readingValue: currentReading ? currentReading.reading : null,
                readingId: currentReading ? currentReading.id : null,
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

        // Filter only those that don't have existing readings for that month/year, 
        // or just use upsert
        for (const r of validReadings) {
            await prisma.meterReading.upsert({
                where: {
                    flatId_month_year: {
                        flatId: r.flatId,
                        month: r.month,
                        year: r.year
                    }
                },
                update: {
                    reading: r.reading,
                    readingDate: new Date()
                },
                create: {
                    flatId: r.flatId,
                    reading: r.reading,
                    month: r.month,
                    year: r.year,
                    readingDate: new Date()
                }
            })
        }

        revalidatePath('/dashboard')
        revalidatePath('/[userId]/electricity', 'page')
        
        return { success: true }
    } catch (error) {
        console.error("Failed to save meter readings:", error)
        return { error: "Failed to save meter readings" }
    }
}
