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

export async function getDashboardStats(monthFilter?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Parse monthFilter
        let paymentMonthWhere: any = undefined
        if (monthFilter && monthFilter !== 'all') {
            const [yStr, mStr] = monthFilter.split('-')
            const y = parseInt(yStr)
            const m = parseInt(mStr) - 1 // JS months are 0-indexed
            // Use a wide 20-day window around the 1st of the month to avoid timezone shifts 
            const safeStart = new Date(y, m, -5)
            const safeEnd = new Date(y, m, 15)
            paymentMonthWhere = {
                gte: safeStart,
                lt: safeEnd
            }
        }

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
            activeTenantsWithLatestPayment,
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

            // 6. Active Tenants with their targeted payment to calculate revenue
            prisma.tenant.findMany({
                where: { isActive: true, ...tenantWhere },
                select: {
                    payments: {
                        where: paymentMonthWhere ? { month: paymentMonthWhere } : undefined,
                        orderBy: { month: 'desc' },
                        take: 1,
                        select: { totalDue: true, amountPaid: true, balance: true }
                    }
                }
            }),

            // 7. Overdue/Pending Payments (all)
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
                            floor: { select: { number: true } },
                            building: { select: { name: true } }
                        }
                    }
                }
            }).then(payments => {
                // Sort by Building Name -> Floor Number -> Flat Number
                return payments.sort((a, b) => {
                    const bA = a.flat.building?.name || ''
                    const bB = b.flat.building?.name || ''
                    if (bA !== bB) return bA.localeCompare(bB)
                    
                    const floorA = a.flat.floor?.number || 0
                    const floorB = b.flat.floor?.number || 0
                    if (floorA !== floorB) return floorA - floorB

                    return a.flat.flatNumber.localeCompare(b.flat.flatNumber, undefined, { numeric: true })
                })
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

        let expectedRevenue = 0
        let collectedRevenue = 0
        let outstandingRevenue = 0
        
        for (const t of activeTenantsWithLatestPayment as any) {
            if (t.payments.length > 0) {
                expectedRevenue += t.payments[0].totalDue
                collectedRevenue += t.payments[0].amountPaid
                outstandingRevenue += t.payments[0].balance
            }
        }

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
