'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getMonthlyReceipts(buildingId: string, month: number, year: number) {
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }

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
                },
                amountPaid: {
                    gt: 0
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
