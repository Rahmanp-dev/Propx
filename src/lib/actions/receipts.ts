'use server'

import prisma from "@/lib/prisma"
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

import { z } from "zod"

const getMonthlyReceiptsSchema = z.object({
    buildingId: z.string().min(1),
    month: z.number().min(1).max(12),
    year: z.number().min(2000),
})

export async function getMonthlyReceipts(buildingId: string, month: number, year: number) {
    const result = getMonthlyReceiptsSchema.safeParse({ buildingId, month, year })
    if (!result.success) return { error: "Invalid input data" }
    
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        if (!orgCtx.isSuperAdmin) {
            const building = await prisma.building.findFirst({
                where: { id: buildingId, organizationId: orgCtx.organizationId! }
            })
            if (!building) return { error: "Building not found or unauthorized" }
        }

        // Determine start and end of the month
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)

        const payments = await prisma.payment.findMany({
            where: {
                flat: {
                    buildingId: buildingId
                },
                month: {
                    gte: startDate,
                    lt: endDate
                }
            },
            include: {
                tenant: true,
                flat: {
                    include: {
                        building: {
                            include: {
                                organization: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                flat: {
                    flatNumber: 'asc'
                }
            }
        })

        return { data: payments }
    } catch (error: any) {
        console.error("Failed to fetch monthly receipts:", error)
        return { error: `Failed to fetch receipts: ${error.message || String(error)}` }
    }
}

export async function getBuildingsForReceipts() {
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }
        const user = session.user as any

        const buildings = await prisma.building.findMany({
            where: user.role !== 'SUPER_ADMIN' ? {
                organizationId: user.organizationId
            } : {},
            orderBy: { name: 'asc' }
        })

        return { data: buildings }
    } catch (error: any) {
        console.error("Failed to fetch buildings:", error)
        return { error: `Failed to fetch buildings: ${error.message || String(error)}` }
    }
}
