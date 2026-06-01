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

export async function getDashboardStats() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Build org-scoped filters
        const buildingWhere = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        const flatWhere = orgCtx.isSuperAdmin
            ? {}
            : { building: { organizationId: orgCtx.organizationId! } }

        const paymentWhere = orgCtx.isSuperAdmin
            ? {}
            : { flat: { building: { organizationId: orgCtx.organizationId! } } }

        const tenantWhere = orgCtx.isSuperAdmin
            ? {}
            : { flat: { building: { organizationId: orgCtx.organizationId! } } }

        const notificationWhere = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        // Parallel data fetching
        const [
            totalBuildings,
            totalFlats,
            occupiedFlats,
            vacantFlats,
            totalTenants,
            currentMonthPayments,
            overduePayments,
            expiringLeases,
            pendingMaintenanceCount,
            newInquiriesCount,
            unreadNotificationsCount,
        ] = await Promise.all([
            // 1. Total buildings
            prisma.building.count({ where: buildingWhere }),

            // 2. Total flats
            prisma.flat.count({ where: flatWhere }),

            // 3. Occupied flats
            prisma.flat.count({ where: { ...flatWhere, status: 'OCCUPIED' } }),

            // 4. Vacant flats
            prisma.flat.count({ where: { ...flatWhere, status: 'VACANT' } }),

            // 5. Total active tenants
            prisma.tenant.count({ where: { ...tenantWhere, isActive: true } }),

            // 6. Current month payment aggregation (revenue from Payment model)
            prisma.payment.aggregate({
                where: {
                    month: { gte: startOfMonth },
                    ...paymentWhere,
                },
                _sum: {
                    totalDue: true,
                    amountPaid: true,
                    balance: true,
                }
            }),

            // 7. Overdue/Pending Payments (top 10)
            prisma.payment.findMany({
                where: {
                    status: { in: ['OVERDUE', 'PENDING', 'PARTIAL'] },
                    balance: { gt: 0 },
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
                },
                orderBy: { balance: 'desc' },
                take: 10
            }),

            // 8. Expiring Leases (next 30 days)
            prisma.tenant.findMany({
                where: {
                    leaseEndDate: {
                        gte: today,
                        lte: thirtyDaysFromNow
                    },
                    isActive: true,
                    ...tenantWhere,
                },
                include: {
                    flat: {
                        select: {
                            flatNumber: true,
                            flatType: true,
                            building: { select: { name: true } }
                        }
                    }
                },
                orderBy: { leaseEndDate: 'asc' },
                take: 10
            }),

            // 9. Pending maintenance count
            prisma.maintenanceRequest.count({
                where: {
                    status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
                    ...(orgCtx.isSuperAdmin ? {} : { building: { organizationId: orgCtx.organizationId! } }),
                }
            }),

            // 10. New inquiries count (this month)
            prisma.tenantInquiry.count({
                where: {
                    status: 'NEW',
                    createdAt: { gte: startOfMonth },
                    ...(orgCtx.isSuperAdmin ? {} : { building: { organizationId: orgCtx.organizationId! } }),
                }
            }),

            // 11. Unread notifications count
            prisma.notification.count({
                where: {
                    isRead: false,
                    ...notificationWhere,
                }
            }),
        ])

        const expectedRevenue = currentMonthPayments._sum.totalDue || 0
        const collectedRevenue = currentMonthPayments._sum.amountPaid || 0
        const outstandingRevenue = currentMonthPayments._sum.balance || 0
        const collectionRate = expectedRevenue > 0
            ? Math.round((collectedRevenue / expectedRevenue) * 100)
            : 0

        return {
            success: true,
            data: {
                counts: {
                    buildings: totalBuildings,
                    flats: totalFlats,
                    tenants: totalTenants,
                    occupiedFlats,
                    vacantFlats,
                    pendingMaintenance: pendingMaintenanceCount,
                    newInquiries: newInquiriesCount,
                    unreadNotifications: unreadNotificationsCount,
                },
                revenue: {
                    expected: expectedRevenue,
                    collected: collectedRevenue,
                    outstanding: outstandingRevenue,
                    collectionRate,
                },
                alerts: {
                    overdue: overduePayments,
                    expiring: expiringLeases,
                },
            }
        }

    } catch (error: any) {
        console.error("Failed to fetch dashboard stats:", error)
        return { error: `Failed to fetch dashboard stats: ${error.message || String(error)}` }
    }
}
