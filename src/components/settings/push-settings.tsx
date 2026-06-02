'use client'

import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { usePushSubscription } from "@/hooks/use-push"
import { toast } from "sonner"

export function PushSettings() {
    const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushSubscription()

    if (!isSupported) {
        return (
            <div className="text-sm text-muted-foreground">
                Push notifications are not supported in this browser.
            </div>
        )
    }

    const handleSubscribe = async () => {
        const success = await subscribe()
        if (success) {
            toast.success("Push notifications enabled")
        } else {
            toast.error("Failed to enable push notifications")
        }
    }

    const handleUnsubscribe = async () => {
        const success = await unsubscribe()
        if (success) {
            toast.success("Push notifications disabled")
        } else {
            toast.error("Failed to disable push notifications")
        }
    }

    if (isLoading) {
        return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking status...</div>
    }

    if (permission === 'denied') {
        return (
            <div className="text-sm text-amber-600">
                You have blocked notifications in your browser settings. Please unblock them to enable this feature.
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <div className="text-sm font-medium">Browser Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                    Receive instant alerts for payments, inquiries, and maintenance
                </div>
            </div>
            {isSubscribed ? (
                <Button variant="outline" size="sm" onClick={handleUnsubscribe}>
                    <BellOff className="mr-2 h-4 w-4" /> Disable
                </Button>
            ) : (
                <Button size="sm" onClick={handleSubscribe}>
                    <Bell className="mr-2 h-4 w-4" /> Enable
                </Button>
            )}
        </div>
    )
}
