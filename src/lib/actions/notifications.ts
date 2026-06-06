'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
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

// ==========================================
// QUERIES
// ==========================================

export async function getNotifications(unreadOnly: boolean = false) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where: Record<string, unknown> = {}
        if (unreadOnly) {
            where.isRead = false
        }
        if (!orgCtx.isSuperAdmin) {
            where.organizationId = orgCtx.organizationId!
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        return { success: true, data: notifications }
    } catch (error: any) {
        console.error("Failed to fetch notifications:", error)
        return { error: `Failed to fetch notifications: ${error.message || String(error)}` }
    }
}

export async function getUnreadCount() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where: Record<string, unknown> = { isRead: false }
        if (!orgCtx.isSuperAdmin) {
            where.organizationId = orgCtx.organizationId!
        }

        const count = await prisma.notification.count({ where })

        return { success: true, data: count }
    } catch (error: any) {
        console.error("Failed to fetch unread count:", error)
        return { error: `Failed to fetch unread count: ${error.message || String(error)}` }
    }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function markAsRead(id: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }
        
        const existing = await prisma.notification.findUnique({
            where: { id },
        })

        if (!existing) {
            return { error: "Notification not found" }
        }

        if (!orgCtx.isSuperAdmin && existing.organizationId !== orgCtx.organizationId) {
            return { error: "Unauthorized" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        await db.collection("Notification").updateOne(
            { _id: new ObjectId(id) },
            { $set: { isRead: true } }
        )

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to mark notification as read:", error)
        return { error: `Failed to mark notification as read: ${error.message || String(error)}` }
    }
}

export async function markAllAsRead() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }
        const client = await clientPromise
        const db = client.db("propx")

        const filter: Record<string, unknown> = { isRead: false }
        if (!orgCtx.isSuperAdmin) {
            filter.organizationId = new ObjectId(orgCtx.organizationId!)
        }

        await db.collection("Notification").updateMany(
            filter,
            { $set: { isRead: true } }
        )

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to mark all notifications as read:", error)
        return { error: `Failed to mark all notifications as read: ${error.message || String(error)}` }
    }
}
