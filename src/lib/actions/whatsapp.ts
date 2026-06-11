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
                templateParams: [
                    tenant.fullName || 'Tenant',
                    totalBalance.toLocaleString('en-IN'),
                    flatNumber,
                    buildingName
                ],
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

        const waConfigured = isWhatsAppConfigured()

        if (waConfigured) {
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i]
                
                const components = log.templateParams ? [{
                    type: 'body',
                    parameters: log.templateParams.map((text: string) => ({ type: 'text', text }))
                }] : undefined;

                const result = await sendWhatsAppTemplate(
                    log.phone,
                    'rent_reminder_v1',
                    'en',
                    components
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

        revalidatePath('/', 'layout')

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
            templateId: "building_announcement_v1",
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

        const waConfigured = isWhatsAppConfigured()

        if (waConfigured) {
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i]
                
                // Use a generic template to bypass the 24-hour restriction
                const components = [{
                    type: 'body',
                    parameters: [{ type: 'text', text: trimmedMessage }]
                }];

                const result = await sendWhatsAppTemplate(
                    log.phone, 
                    'building_announcement_v1',
                    'en',
                    components
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

        revalidatePath('/', 'layout')

        return { success: true, data: { count: logs.length, sent, queued } }
    } catch (error: any) {
        console.error("Failed to send broadcast message:", error)
        return { error: `Failed to send broadcast message: ${error.message || String(error)}` }
    }
}

export async function sendWhatsAppNotification(paymentId: string, type: 'INVOICE' | 'RECEIPT') {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { 
                tenant: { 
                    include: { flat: { include: { building: { select: { organizationId: true } } } } } 
                } 
            }
        })

        if (!payment || !payment.tenant) {
            return { error: "Payment or Tenant not found" }
        }

        if (!orgCtx.isSuperAdmin && payment.tenant.flat?.building?.organizationId !== orgCtx.organizationId) {
            return { error: "Unauthorized access to payment record" }
        }

        const messageType = type === 'INVOICE' ? 'RENT_REMINDER' : 'PAYMENT_RECEIPT'
        const templateName = type === 'INVOICE' ? 'invoice_reminder_v1' : 'payment_receipt_v1'
        const content = type === 'INVOICE' 
            ? `Reminder: Your rent for this month is due. Pending amount: ₹${payment.balance}` 
            : `Thank you! Your payment of ₹${payment.amountPaid} has been received.`

        const components = [{
            type: 'body',
            parameters: type === 'INVOICE' 
                ? [
                    { type: 'text', text: payment.tenant.fullName || 'Tenant' },
                    { type: 'text', text: (payment.balance || 0).toLocaleString('en-IN') }
                ]
                : [
                    { type: 'text', text: payment.tenant.fullName || 'Tenant' },
                    { type: 'text', text: (payment.amountPaid || 0).toLocaleString('en-IN') }
                ]
        }]

        let status: 'QUEUED' | 'SENT' | 'FAILED' = 'QUEUED'
        let waMessageId = null
        let errorMsg = null

        if (isWhatsAppConfigured()) {
            const result = await sendWhatsAppTemplate(payment.tenant.phone, templateName, 'en', components)
            if (result.success && result.messageId) {
                status = 'SENT'
                waMessageId = result.messageId
            } else {
                status = 'FAILED'
                errorMsg = result.error
            }
        } else {
            return { error: "WhatsApp API is not configured. Please add ENV variables." }
        }

        // Log the WhatsApp message using native driver
        const client = await clientPromise
        const db = client.db("propx")
        const collection = db.collection("WhatsAppLog")

        await collection.insertOne({
            tenantId: new ObjectId(payment.tenant.id),
            phone: payment.tenant.phone,
            messageType: messageType,
            templateId: templateName,
            content: content,
            status: status,
            error: errorMsg,
            waMessageId: waMessageId,
            createdAt: new Date(),
            ...(status === 'SENT' ? { sentAt: new Date() } : {})
        })

        if (status === 'FAILED') {
            return { error: errorMsg || "Failed to send WhatsApp message" }
        }

        return { success: true }
    } catch (error: any) {
        console.error("WhatsApp sending error:", error)
        return { error: "Failed to send WhatsApp message" }
    }
}
