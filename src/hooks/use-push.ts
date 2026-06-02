'use client'

import { useState, useEffect } from 'react'
import { saveSubscription, removeSubscription } from '@/lib/actions/push'

export function usePushSubscription() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)
        
        if (supported) {
            setPermission(Notification.permission)
            checkSubscription()
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error("Error checking push subscription:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    const subscribe = async () => {
        if (!isSupported) return false

        setIsLoading(true)
        try {
            const permissionResult = await Notification.requestPermission()
            setPermission(permissionResult)

            if (permissionResult !== 'granted') {
                throw new Error('Notification permission not granted')
            }

            const registration = await navigator.serviceWorker.ready
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!publicVapidKey) {
                throw new Error('VAPID public key not found')
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            })

            await saveSubscription(JSON.parse(JSON.stringify(subscription)))
            setIsSubscribed(true)
            return true
        } catch (error) {
            console.error("Failed to subscribe to push notifications:", error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        if (!isSupported) return false

        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                await subscription.unsubscribe()
                await removeSubscription(subscription.endpoint)
                setIsSubscribed(false)
            }
            return true
        } catch (error) {
            console.error("Failed to unsubscribe:", error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        isSupported,
        isSubscribed,
        permission,
        isLoading,
        subscribe,
        unsubscribe
    }
}
