'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { PRICING, calculatePeriodEnd } from "@/lib/plan-guard"

async function requireSuperAdmin() {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access required')
    }
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export async function getSuperAdminDashboard() {
    try {
        await requireSuperAdmin()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalOrgs,
            activeOrgs,
            pendingOrgs,
            suspendedOrgs,
            totalRevenueAgg,
            monthlyRevenueAgg,
            starterCount,
            builderCount,
            portfolioCount,
            recentRegistrations,
            recentPayments,
        ] = await Promise.all([
            prisma.organization.count(),
            prisma.organization.count({ where: { isActive: true, isSuspended: false } }),
            prisma.organization.count({ where: { planStatus: 'PENDING_PAYMENT' } }),
            prisma.organization.count({ where: { isSuspended: true } }),

            // Total revenue from VERIFIED subscription payments
            prisma.subscriptionPayment.aggregate({
                where: { status: 'VERIFIED' },
                _sum: { amount: true },
            }),

            // This month's revenue
            prisma.subscriptionPayment.aggregate({
                where: {
                    status: 'VERIFIED',
                    createdAt: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),

            // Plan distribution
            prisma.organization.count({ where: { plan: 'STARTER' } }),
            prisma.organization.count({ where: { plan: 'BUILDER' } }),
            prisma.organization.count({ where: { plan: 'PORTFOLIO' } }),

            // Recent registrations (last 10)
            prisma.organization.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    users: {
                        where: { role: 'OWNER' },
                        select: { name: true, email: true },
                        take: 1,
                    },
                    _count: {
                        select: { buildings: true },
                    },
                },
            }),

            // Recent subscription payments
            prisma.subscriptionPayment.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    organization: {
                        select: { name: true, email: true },
                    },
                },
            }),
        ])

        return {
            success: true,
            data: {
                totalOrgs,
                activeOrgs,
                pendingOrgs,
                suspendedOrgs,
                totalRevenue: totalRevenueAgg._sum.amount || 0,
                monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
                planDistribution: {
                    STARTER: starterCount,
                    BUILDER: builderCount,
                    PORTFOLIO: portfolioCount,
                },
                recentRegistrations: JSON.parse(JSON.stringify(recentRegistrations)),
                recentPayments: JSON.parse(JSON.stringify(recentPayments)),
            },
        }
    } catch (error: any) {
        console.error("Failed to fetch super admin dashboard:", error)
        return { error: `Failed to fetch dashboard: ${error.message || String(error)}` }
    }
}

// ==========================================
// ORGANIZATION LIST
// ==========================================

export async function getOrganizations(filters?: { status?: string; plan?: string }) {
    try {
        await requireSuperAdmin()
        const where: any = {}

        if (filters?.status) {
            switch (filters.status) {
                case 'active':
                    where.isActive = true
                    where.isSuspended = false
                    break
                case 'pending':
                    where.planStatus = 'PENDING_PAYMENT'
                    break
                case 'suspended':
                    where.isSuspended = true
                    break
            }
        }

        if (filters?.plan) {
            where.plan = filters.plan
        }

        const orgs = await prisma.organization.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                users: {
                    where: { role: 'OWNER' },
                    select: { name: true, email: true },
                    take: 1,
                },
                _count: {
                    select: {
                        users: true,
                        buildings: true,
                    },
                },
            },
        })

        // Get unit counts per org
        const orgsWithUnits = await Promise.all(
            orgs.map(async (org) => {
                const unitCount = await prisma.flat.count({
                    where: {
                        building: { organizationId: org.id },
                    },
                })
                return {
                    ...org,
                    unitCount,
                }
            })
        )

        return {
            success: true,
            data: JSON.parse(JSON.stringify(orgsWithUnits)),
        }
    } catch (error: any) {
        console.error("Failed to fetch organizations:", error)
        return { error: `Failed to fetch organizations: ${error.message || String(error)}` }
    }
}

// ==========================================
// ORGANIZATION DETAIL
// ==========================================

export async function getOrganizationDetail(orgId: string) {
    try {
        await requireSuperAdmin()
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        createdAt: true,
                    },
                },
                buildings: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        totalFloors: true,
                        totalFlats: true,
                        occupancyRate: true,
                        createdAt: true,
                    },
                },
                subscriptionPayments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!org) {
            return { error: 'Organization not found' }
        }

        // Get unit count
        const unitCount = await prisma.flat.count({
            where: {
                building: { organizationId: orgId },
            },
        })

        return {
            success: true,
            data: JSON.parse(JSON.stringify({ ...org, unitCount })),
        }
    } catch (error: any) {
        console.error("Failed to fetch organization detail:", error)
        return { error: `Failed to fetch organization: ${error.message || String(error)}` }
    }
}

// ==========================================
// VERIFY SUBSCRIPTION PAYMENT
// ==========================================

export async function verifySubscriptionPayment(
    paymentId: string,
    action: 'VERIFIED' | 'REJECTED',
    notes?: string
) {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")

        // Get the payment first
        const payment = await prisma.subscriptionPayment.findUnique({
            where: { id: paymentId },
            include: { organization: true },
        })

        if (!payment) {
            return { error: 'Payment not found' }
        }

        // Update payment status
        await db.collection("SubscriptionPayment").updateOne(
            { _id: new ObjectId(paymentId) },
            {
                $set: {
                    status: action,
                    verifiedAt: new Date(),
                    verifiedBy: "admin-env-var",
                    ...(notes && { notes }),
                },
            }
        )

        // If verified, activate the organization
        if (action === 'VERIFIED') {
            await db.collection("Organization").updateOne(
                { _id: new ObjectId(payment.organizationId) },
                {
                    $set: {
                        planStatus: 'ACTIVE',
                        isActive: true,
                        isSuspended: false,
                        subscriptionStart: payment.periodStart,
                        subscriptionEnd: payment.periodEnd,
                        plan: payment.plan,
                        billingCycle: payment.billingCycle,
                        updatedAt: new Date(),
                    },
                }
            )
        }

        // Create notification for the org
        await db.collection("Notification").insertOne({
            organizationId: new ObjectId(payment.organizationId),
            type: action === 'VERIFIED' ? 'ORG_ACTIVATED' : 'SUBSCRIPTION_PAYMENT',
            title: action === 'VERIFIED'
                ? 'Subscription Payment Verified'
                : 'Subscription Payment Rejected',
            message: action === 'VERIFIED'
                ? `Your ${payment.plan} plan subscription has been activated. Welcome to PropX!`
                : `Your subscription payment of ₹${payment.amount} has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
            isRead: false,
            createdAt: new Date(),
        })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to verify payment:", error)
        return { error: `Failed to verify payment: ${error.message || String(error)}` }
    }
}

// ==========================================
// TOGGLE ORG STATUS
// ==========================================

export async function toggleOrgStatus(orgId: string, action: 'activate' | 'suspend') {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")

        if (action === 'suspend') {
            await db.collection("Organization").updateOne(
                { _id: new ObjectId(orgId) },
                {
                    $set: {
                        isSuspended: true,
                        isActive: false,
                        updatedAt: new Date(),
                    },
                }
            )
        } else {
            await db.collection("Organization").updateOne(
                { _id: new ObjectId(orgId) },
                {
                    $set: {
                        isSuspended: false,
                        isActive: true,
                        updatedAt: new Date(),
                    },
                }
            )
        }

        // Create notification
        await db.collection("Notification").insertOne({
            organizationId: new ObjectId(orgId),
            type: 'SYSTEM',
            title: action === 'suspend' ? 'Account Suspended' : 'Account Activated',
            message: action === 'suspend'
                ? 'Your account has been suspended by the platform admin. Please contact support.'
                : 'Your account has been reactivated. You can now access all features.',
            isRead: false,
            createdAt: new Date(),
        })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to toggle org status:", error)
        return { error: `Failed to update organization: ${error.message || String(error)}` }
    }
}

// ==========================================
// MANUAL ACTIVATE ORGANIZATION
// ==========================================

export async function manualActivateOrganization(orgId: string) {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
        })

        if (!org) {
            return { error: 'Organization not found' }
        }

        const pricing = PRICING[org.plan]?.[org.billingCycle]
        if (!pricing && org.plan !== 'FREE') {
            return { error: 'Invalid plan configuration for this organization.' }
        }
        
        const amount = pricing ? pricing.amount : 0

        const periodStart = new Date()
        const periodEnd = org.plan === 'FREE' ? null : calculatePeriodEnd(periodStart, org.billingCycle)

        // Update org status
        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            {
                $set: {
                    planStatus: 'ACTIVE',
                    isActive: true,
                    isSuspended: false,
                    subscriptionStart: periodStart,
                    subscriptionEnd: periodEnd,
                    updatedAt: new Date(),
                },
            }
        )

        // Create a verified payment record for auditing (if not FREE)
        if (org.plan !== 'FREE') {
            await db.collection("SubscriptionPayment").insertOne({
                _id: new ObjectId(),
                organizationId: new ObjectId(orgId),
                amount: amount,
                plan: org.plan,
                billingCycle: org.billingCycle,
                upiTransactionId: 'MANUAL_OVERRIDE',
                screenshotUrl: '', // empty for manual overrides
                status: 'VERIFIED',
                verifiedBy: "admin-manual-override",
                verifiedAt: new Date(),
                periodStart,
                periodEnd,
                notes: 'Manually verified and activated by Super Admin.',
                createdAt: new Date(),
            })
        }

        // Create notification
        await db.collection("Notification").insertOne({
            organizationId: new ObjectId(orgId),
            type: 'ORG_ACTIVATED',
            title: 'Account Manually Activated',
            message: `Your ${org.plan} plan has been manually verified and activated by the administrator. Welcome to PropX!`,
            isRead: false,
            createdAt: new Date(),
        })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to manually activate org:", error)
        return { error: `Failed to activate organization: ${error.message || String(error)}` }
    }
}

// ==========================================
// GET ALL PAYMENTS
// ==========================================

export async function getAllPayments(statusFilter?: string) {
    try {
        await requireSuperAdmin()
        const where: any = {}
        if (statusFilter && statusFilter !== 'all') {
            where.status = statusFilter
        }

        const payments = await prisma.subscriptionPayment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                organization: {
                    select: { name: true, email: true },
                },
            },
        })

        return {
            success: true,
            data: JSON.parse(JSON.stringify(payments)),
        }
    } catch (error: any) {
        console.error("Failed to fetch payments:", error)
        return { error: `Failed to fetch payments: ${error.message || String(error)}` }
    }
}

// ==========================================
// PLATFORM SETTINGS
// ==========================================

export async function getPlatformSettings() {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")

        const settings = await db.collection("PlatformSettings").findOne({ key: 'platform' })
        return {
            success: true,
            data: settings || { upiId: '', key: 'platform' },
        }
    } catch (error: any) {
        console.error("Failed to fetch settings:", error)
        return { error: `Failed to fetch settings: ${error.message || String(error)}` }
    }
}

export async function updatePlatformSettings(data: { upiId: string }) {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")

        await db.collection("PlatformSettings").updateOne(
            { key: 'platform' },
            {
                $set: {
                    upiId: data.upiId,
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        )

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to update settings:", error)
        return { error: `Failed to update settings: ${error.message || String(error)}` }
    }
}

// ==========================================
// USER MANAGEMENT
// ==========================================

export async function getUsers(filters?: { organizationId?: string; role?: string }) {
    try {
        await requireSuperAdmin()
        const where: any = {}

        if (filters?.organizationId) {
            where.organizationId = filters.organizationId
        }

        if (filters?.role) {
            where.role = filters.role
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                organization: {
                    select: { id: true, name: true, isActive: true, isSuspended: true },
                },
            },
        })

        return {
            success: true,
            data: JSON.parse(JSON.stringify(users)),
        }
    } catch (error: any) {
        console.error("Failed to fetch users:", error)
        return { error: `Failed to fetch users: ${error.message || String(error)}` }
    }
}

export async function getUserDetail(userId: string) {
    try {
        await requireSuperAdmin()
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        plan: true,
                        planStatus: true,
                        isActive: true,
                        isSuspended: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!user) {
            return { error: 'User not found' }
        }

        return {
            success: true,
            data: JSON.parse(JSON.stringify(user)),
        }
    } catch (error: any) {
        console.error("Failed to fetch user detail:", error)
        return { error: `Failed to fetch user: ${error.message || String(error)}` }
    }
}

export async function updateUser(
    userId: string,
    data: { name?: string; email?: string; role?: string; phone?: string }
) {
    try {
        await requireSuperAdmin()
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.email !== undefined) updateData.email = data.email
        if (data.role !== undefined) updateData.role = data.role
        if (data.phone !== undefined) updateData.phone = data.phone

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to update user:", error)
        return { error: `Failed to update user: ${error.message || String(error)}` }
    }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        await requireSuperAdmin()
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to reset password:", error)
        return { error: `Failed to reset password: ${error.message || String(error)}` }
    }
}

export async function deleteUser(userId: string) {
    try {
        await requireSuperAdmin()
        // Prevent deleting super admins
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return { error: 'User not found' }
        if (user.role === 'SUPER_ADMIN') return { error: 'Cannot delete super admin users' }

        await prisma.user.delete({ where: { id: userId } })

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete user:", error)
        return { error: `Failed to delete user: ${error.message || String(error)}` }
    }
}

export async function impersonateUser(userId: string) {
    try {
        await requireSuperAdmin()
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: {
                    select: { id: true, name: true },
                },
            },
        })

        if (!user) return { error: 'User not found' }

        return {
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization?.name,
            },
        }
    } catch (error: any) {
        console.error("Failed to get impersonation data:", error)
        return { error: `Failed to impersonate: ${error.message || String(error)}` }
    }
}

// ==========================================
// CHECK EXPIRED SUBSCRIPTIONS
// ==========================================

export async function checkExpiredSubscriptions() {
    try {
        await requireSuperAdmin()
        const client = await clientPromise
        const db = client.db("propx")
        const now = new Date()

        // Find all active, non-FREE orgs whose subscription has ended
        const result = await db.collection("Organization").updateMany(
            {
                planStatus: 'ACTIVE',
                plan: { $ne: 'FREE' },
                subscriptionEnd: { $lt: now },
            },
            {
                $set: {
                    planStatus: 'EXPIRED',
                    isActive: false,
                    updatedAt: now,
                },
            }
        )

        revalidatePath('/', 'layout')

        return {
            success: true,
            expiredCount: result.modifiedCount,
        }
    } catch (error: any) {
        console.error("Failed to check expired subscriptions:", error)
        return { error: `Failed to check expired subscriptions: ${error.message || String(error)}` }
    }
}
