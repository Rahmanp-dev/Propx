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

export async function getFlatLedger(flatId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where: any = { flatId }
        if (!orgCtx.isSuperAdmin) {
            where.flat = { building: { organizationId: orgCtx.organizationId! } }
        }

        const payments = await prisma.payment.findMany({
            where,
            orderBy: { month: 'desc' },
            include: {
                tenant: true,
                flat: {
                    include: {
                        building: true
                    }
                }
            }
        })

        const flat = await prisma.flat.findUnique({
            where: { id: flatId },
            include: {
                building: true,
                tenants: {
                    where: { isActive: true },
                    take: 1
                }
            }
        })

        // Verify flat belongs to user's org
        if (flat && !orgCtx.isSuperAdmin && flat.building.organizationId !== orgCtx.organizationId) {
            return { error: "Flat not found" }
        }

        return { data: { payments, flat } }
    } catch (error: any) {
        console.error("Failed to fetch flat ledger:", error)
        return { error: `Failed to fetch ledger: ${error.message || String(error)}` }
    }
}

export async function getAllFlats() {
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }
        const user = session.user as any

        const flats = await prisma.flat.findMany({
            where: user.role !== 'SUPER_ADMIN' ? {
                building: {
                    organizationId: user.organizationId
                }
            } : {},
            include: {
                building: true,
                tenants: {
                    where: { isActive: true },
                    take: 1
                }
            },
            orderBy: [
                { building: { name: 'asc' } },
                { flatNumber: 'asc' }
            ]
        })

        return { data: flats }
    } catch (error: any) {
        console.error("Failed to fetch flats:", error)
        return { error: `Failed to fetch flats: ${error.message || String(error)}` }
    }
}

export async function getMasterMonthLedger(monthStr: string, buildingId?: string) { // monthStr format: "YYYY-MM"
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }
        const user = session.user as any

        const startDate = new Date(`${monthStr}-01T00:00:00.000Z`)
        startDate.setHours(startDate.getHours() - 12) // Pad back 12 hours for IST timezone offset
        
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)

        const payments = await prisma.payment.findMany({
            where: {
                month: {
                    gte: startDate,
                    lt: endDate
                },
                flat: {
                    building: {
                        id: buildingId || undefined,
                        organizationId: user.role !== 'SUPER_ADMIN' ? user.organizationId : undefined
                    }
                }
            },
            include: {
                flat: {
                    include: {
                        building: true,
                        meterReadings: {
                            orderBy: { readingDate: 'desc' },
                            take: 1
                        }
                    }
                },
                tenant: true
            },
            orderBy: [
                { flat: { building: { name: 'asc' } } },
                { flat: { flatNumber: 'asc' } }
            ]
        })

        return { data: payments }
    } catch (error: any) {
        console.error("Failed to fetch master ledger:", error)
        return { error: `Failed to fetch master ledger: ${error.message || String(error)}` }
    }
}
