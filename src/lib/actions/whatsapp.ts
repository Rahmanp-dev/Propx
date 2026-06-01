'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { isWhatsAppConfigured, sendWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/whatsapp-client"
import { auth } from "@/lib/auth"

// ==========================================
// ORG CONTEXT HELPER
// ==========================================

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

// ==========================================
// QUERIES
// ==========================================

export async function getWhatsAppLogs(limit: number = 50) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Scope through tenant→flat→building→org
        const where = orgCtx.isSuperAdmin
            ? {}
            : { tenant: { flat: { building: { organizationId: orgCtx.organizationId! } } } }

        const logs = await prisma.whatsAppLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            where,
            include: {
                tenant: {
                    select: {
                        fullName: true,
                        phone: true,
                    }
                }
            }
        })

        return { success: true, data: logs }
    } catch (error: any) {
        console.error("Failed to fetch WhatsApp logs:", error)
        return { error: `Failed to fetch WhatsApp logs: ${error.message || String(error)}` }
    }
}

export async function getWhatsAppStats() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where = orgCtx.isSuperAdmin
            ? {}
            : { tenant: { flat: { building: { organizationId: orgCtx.organizationId! } } } }

        const [statusBreakdown, typeBreakdown] = await Promise.all([
            prisma.whatsAppLog.groupBy({
                by: ['status'],
                _count: true,
                where,
            }),
            prisma.whatsAppLog.groupBy({
                by: ['messageType'],
                _count: true,
                where,
            }),
        ])

        const byStatus: Record<string, number> = {
            QUEUED: 0,
            SENT: 0,
            DELIVERED: 0,
            READ: 0,
            FAILED: 0,
        }
        statusBreakdown.forEach(s => {
            byStatus[s.status] = s._count
        })

        const byType: Record<string, number> = {}
        typeBreakdown.forEach(t => {
            byType[t.messageType] = t._count
        })

        const total = Object.values(byStatus).reduce((a, b) => a + b, 0)

        return {
            success: true,
            data: {
                total,
                byStatus,
                byType,
            }
        }
    } catch (error: any) {
        console.error("Failed to fetch WhatsApp stats:", error)
        return { error: `Failed to fetch WhatsApp stats: ${error.message || String(error)}` }
    }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function sendRentReminders(buildingId?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // Build org-scoped building filter
        const buildingFilter: Record<string, any> = {}
        if (buildingId) {
            buildingFilter.buildingId = buildingId
        }
        if (!orgCtx.isSuperAdmin) {
            buildingFilter.building = { organizationId: orgCtx.organizationId! }
        }

        // Find all active tenants with pending/partial/overdue payments this month
        const tenantsWithPending = await prisma.tenant.findMany({
            where: {
                isActive: true,
                whatsappOptIn: true,
                flat: buildingId
                    ? { buildingId, ...(orgCtx.isSuperAdmin ? {} : { building: { organizationId: orgCtx.organizationId! } }) }
                    : (orgCtx.isSuperAdmin ? {} : { building: { organizationId: orgCtx.organizationId! } }),
                payments: {
                    some: {
                        month: { gte: startOfMonth },
                        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                        balance: { gt: 0 },
                    }
                }
            },
            include: {
                flat: {
                    select: {
                        flatNumber: true,
                        building: { select: { name: true } },
                    }
                },
                payments: {
                    where: {
                        month: { gte: startOfMonth },
                        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                        balance: { gt: 0 },
                    },
                    select: {
                        balance: true,
                        totalDue: true,
                    }
                }
            }
        })

        if (tenantsWithPending.length === 0) {
            return { success: true, data: { count: 0, message: "No tenants with pending payments found" } }
        }

        const client = await clientPromise
        const db = client.db("propx")
        const collection = db.collection("WhatsAppLog")

        const now = new Date()
        const logs = tenantsWithPending.map(tenant => {
            const totalBalance = tenant.payments.reduce((sum, p) => sum + p.balance, 0)
            const flatNumber = tenant.flat?.flatNumber || "N/A"
            const buildingName = tenant.flat?.building?.name || "N/A"

            return {
                tenantId: new ObjectId(tenant.id),
                phone: tenant.phone,
                messageType: "RENT_REMINDER",
                templateId: "rent_reminder_v1",
                content: `Dear ${tenant.fullName}, this is a reminder that your rent of ₹${totalBalance.toLocaleString('en-IN')} for flat ${flatNumber} at ${buildingName} is due. Please make the payment at your earliest convenience.`,
                status: "QUEUED",
                sentAt: null,
                waMessageId: null,
                error: null,
                createdAt: now,
            }
        })

        const insertResult = await collection.insertMany(logs)
        const insertedIds = Object.values(insertResult.insertedIds)

        let sent = 0
        let queued = logs.length

        let waAccessToken: string | undefined = undefined
        let waPhoneNumberId: string | undefined = undefined
        let waConfigured = false

        if (orgCtx.organizationId) {
            const org = await prisma.organization.findUnique({
                where: { id: orgCtx.organizationId },
                select: { whatsappAccessToken: true, whatsappPhoneNumberId: true }
            })
            if (org?.whatsappAccessToken && org?.whatsappPhoneNumberId) {
                waAccessToken = org.whatsappAccessToken
                waPhoneNumberId = org.whatsappPhoneNumberId
                waConfigured = true
            }
        }

        if (waConfigured) {
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i]
                const result = await sendWhatsAppTemplate(
                    log.phone,
                    'rent_reminder_v1',
                    'en',
                    undefined,
                    waAccessToken,
                    waPhoneNumberId
                )

                if (result.success && result.messageId) {
                    await collection.updateOne(
                        { _id: insertedIds[i] },
                        { $set: { status: 'SENT', sentAt: new Date(), waMessageId: result.messageId } }
                    )
                    sent++
                    queued--
                } else if (result.error) {
                    await collection.updateOne(
                        { _id: insertedIds[i] },
                        { $set: { error: result.error } }
                    )
                }
            }
        }

        revalidatePath('/whatsapp')
        revalidatePath('/dashboard')

        return { success: true, data: { count: logs.length, sent, queued } }
    } catch (error: any) {
        console.error("Failed to send rent reminders:", error)
        return { error: `Failed to send rent reminders: ${error.message || String(error)}` }
    }
}

export async function sendBroadcastMessage(message: string, buildingId?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        if (!message || message.trim().length === 0) {
            return { error: "Message cannot be empty" }
        }

        // Build org-scoped flat filter
        const flatFilter: Record<string, any> = {}
        if (buildingId) {
            flatFilter.buildingId = buildingId
        }
        if (!orgCtx.isSuperAdmin) {
            flatFilter.building = { organizationId: orgCtx.organizationId! }
        }

        // Find all active tenants (optionally filtered by building, always scoped by org)
        const tenants = await prisma.tenant.findMany({
            where: {
                isActive: true,
                whatsappOptIn: true,
                flat: Object.keys(flatFilter).length > 0 ? flatFilter : undefined,
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
            }
        })

        if (tenants.length === 0) {
            return { success: true, data: { count: 0, message: "No active tenants found" } }
        }

        const client = await clientPromise
        const db = client.db("propx")
        const collection = db.collection("WhatsAppLog")

        const now = new Date()
        const trimmedMessage = message.trim()
        const logs = tenants.map(tenant => ({
            tenantId: new ObjectId(tenant.id),
            phone: tenant.phone,
            messageType: "BROADCAST",
            templateId: null,
            content: trimmedMessage,
            status: "QUEUED",
            sentAt: null,
            waMessageId: null,
            error: null,
            createdAt: now,
        }))

        const insertResult = await collection.insertMany(logs)
        const insertedIds = Object.values(insertResult.insertedIds)

        let sent = 0
        let queued = logs.length

        let waAccessToken: string | undefined = undefined
        let waPhoneNumberId: string | undefined = undefined
        let waConfigured = false

        if (orgCtx.organizationId) {
            const org = await prisma.organization.findUnique({
                where: { id: orgCtx.organizationId },
                select: { whatsappAccessToken: true, whatsappPhoneNumberId: true }
            })
            if (org?.whatsappAccessToken && org?.whatsappPhoneNumberId) {
                waAccessToken = org.whatsappAccessToken
                waPhoneNumberId = org.whatsappPhoneNumberId
                waConfigured = true
            }
        }

        if (waConfigured) {
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i]
                const result = await sendWhatsAppMessage(
                    log.phone, 
                    trimmedMessage,
                    waAccessToken,
                    waPhoneNumberId
                )

                if (result.success && result.messageId) {
                    await collection.updateOne(
                        { _id: insertedIds[i] },
                        { $set: { status: 'SENT', sentAt: new Date(), waMessageId: result.messageId } }
                    )
                    sent++
                    queued--
                } else if (result.error) {
                    await collection.updateOne(
                        { _id: insertedIds[i] },
                        { $set: { error: result.error } }
                    )
                }
            }
        }

        revalidatePath('/whatsapp')

        return { success: true, data: { count: logs.length, sent, queued } }
    } catch (error: any) {
        console.error("Failed to send broadcast message:", error)
        return { error: `Failed to send broadcast message: ${error.message || String(error)}` }
    }
}
