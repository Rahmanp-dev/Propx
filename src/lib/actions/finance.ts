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

export async function getFinanceStats(filterMonth?: number, filterYear?: number) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const today = new Date()
        const targetYear = filterYear ?? today.getFullYear()
        const targetMonth = filterMonth ?? today.getMonth()

        const startOfYear = new Date(targetYear, 0, 1)
        const startOfMonth = new Date(targetYear, targetMonth, 1)
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0)

        // Org-scoped payment filter
        const paymentWhere = orgCtx.isSuperAdmin
            ? {}
            : { flat: { building: { organizationId: orgCtx.organizationId! } } }

        const buildingWhere = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        // 1. Overall aggregation
        const paymentStats = await prisma.payment.aggregate({
            where: paymentWhere,
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true,
                rentDue: true,
                maintenanceDue: true,
                electricityDue: true,
            },
            _count: true
        })

        // 2. Current month stats
        const currentMonthStats = await prisma.payment.aggregate({
            where: {
                month: { gte: startOfMonth, lte: endOfMonth },
                ...paymentWhere,
            },
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true,
            },
            _count: true
        })

        // 3. Payment status breakdown for current month
        const statusBreakdown = await prisma.payment.groupBy({
            by: ['status'],
            _count: true,
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true,
            },
            where: {
                month: { gte: startOfMonth, lte: endOfMonth },
                ...paymentWhere,
            }
        })

        // 4. Monthly chart data (Jan-Dec)
        const yearlyPayments = await prisma.payment.findMany({
            where: {
                month: { gte: startOfYear },
                ...paymentWhere,
            },
            select: {
                month: true,
                amountPaid: true,
                totalDue: true,
            }
        })

        const monthlyData = Array.from({ length: 12 }).map((_, i) => {
            const monthDate = new Date(today.getFullYear(), i, 1)
            const monthName = monthDate.toLocaleString('default', { month: 'short' })

            const monthPayments = yearlyPayments.filter(p => new Date(p.month).getMonth() === i)
            const collected = monthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
            const expected = monthPayments.reduce((sum, p) => sum + (p.totalDue || 0), 0)

            return {
                name: monthName,
                collected,
                expected,
            }
        })

        // 5. Building-wise collection summary
        const buildingStats = await prisma.building.findMany({
            where: buildingWhere,
            select: {
                id: true,
                name: true,
                flats: {
                    select: {
                        payments: {
                            where: { month: { gte: startOfMonth, lte: endOfMonth } },
                            select: {
                                totalDue: true,
                                amountPaid: true,
                                status: true,
                            }
                        }
                    }
                }
            }
        })

        const buildingBreakdown = buildingStats.map(b => {
            let totalDue = 0
            let totalCollected = 0
            let paidCount = 0
            let pendingCount = 0

            b.flats.forEach(f => {
                f.payments.forEach(p => {
                    totalDue += p.totalDue
                    totalCollected += p.amountPaid
                    if (p.status === 'PAID') paidCount++
                    else pendingCount++
                })
            })

            return {
                id: b.id,
                name: b.name,
                totalDue,
                totalCollected,
                paidCount,
                pendingCount,
                collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0
            }
        })

        // 6. Recent Transactions with tenant name, flat number, flat type, building name
        const recentTransactions = await prisma.payment.findMany({
            take: 15,
            orderBy: { updatedAt: 'desc' },
            where: {
                amountPaid: { gt: 0 },
                ...paymentWhere,
            },
            include: {
                tenant: { select: { fullName: true, phone: true } },
                flat: {
                    select: {
                        flatNumber: true,
                        flatType: true,
                        building: { select: { name: true } }
                    }
                }
            }
        })

        const totalRevenue = paymentStats._sum.amountPaid || 0
        const totalOutstanding = paymentStats._sum.balance || 0
        const totalExpected = paymentStats._sum.totalDue || 0
        const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0

        const currentExpected = currentMonthStats._sum.totalDue || 0
        const currentCollected = currentMonthStats._sum.amountPaid || 0
        const currentOutstanding = currentMonthStats._sum.balance || 0

        return {
            success: true,
            data: {
                totalRevenue,
                totalOutstanding,
                totalExpected,
                collectionRate,
                currentMonth: {
                    expected: currentExpected,
                    collected: currentCollected,
                    outstanding: currentOutstanding,
                    collectionRate: currentExpected > 0 ? Math.round((currentCollected / currentExpected) * 100) : 0,
                },
                statusBreakdown,
                chartData: monthlyData,
                buildingBreakdown,
                recentTransactions,
                breakdownTotals: {
                    rent: paymentStats._sum.rentDue || 0,
                    maintenance: paymentStats._sum.maintenanceDue || 0,
                    electricity: paymentStats._sum.electricityDue || 0,
                }
            }
        }

    } catch (error: any) {
        console.error("Failed to fetch finance stats:", error)
        return { error: `Failed to fetch finance stats: ${error.message || String(error)}` }
    }
}
