'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import webpush from "web-push"

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@propx.in',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export async function saveSubscription(subscription: any) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Not authenticated" }

        const userId = session.user.id

        // Upsert the subscription using endpoint as unique key
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: userId,
            },
            create: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: userId,
            }
        })

        return { success: true }
    } catch (error: any) {
        console.error("Failed to save push subscription:", error)
        return { error: "Failed to save subscription" }
    }
}

export async function removeSubscription(endpoint: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Not authenticated" }

        await prisma.pushSubscription.delete({
            where: { endpoint }
        })

        return { success: true }
    } catch (error: any) {
        // Might already be deleted
        return { success: true }
    }
}

// Function to send push notification to an organization's users
export async function sendPushToOrganization(organizationId: string, payload: any) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn("VAPID keys not configured, skipping push notification")
        return { success: false, error: "VAPID keys not configured" }
    }

    try {
        // Find all users belonging to this organization
        const users = await prisma.user.findMany({
            where: { organizationId },
            include: { pushSubscriptions: true }
        })

        const subscriptions = users.flatMap(u => u.pushSubscriptions)
        
        if (subscriptions.length === 0) return { success: true, sent: 0 }

        const pushPayload = JSON.stringify({
            title: payload.title || 'PropX Notification',
            body: payload.message || '',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            url: payload.url || '/dashboard',
            data: payload.data || {}
        })

        const promises = subscriptions.map(async (sub) => {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }
            try {
                await webpush.sendNotification(pushSub, pushPayload)
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription has expired or is no longer valid
                    await prisma.pushSubscription.delete({ where: { id: sub.id } })
                } else {
                    console.error("Push notification error:", error)
                }
            }
        })

        await Promise.allSettled(promises)
        
        return { success: true, sent: promises.length }
    } catch (error: any) {
        console.error("Failed to send push notification:", error)
        return { error: "Failed to send push notification" }
    }
}
