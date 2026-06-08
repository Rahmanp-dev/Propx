"use client"

import { usePushSubscription } from "@/hooks/use-push"
import { BellRing, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function PushNotificationPrompt() {
    const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushSubscription()
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Show prompt if supported, not subscribed, permission is default (not denied), and not loading
        if (!isLoading && isSupported && !isSubscribed && permission === 'default') {
            const hasDismissed = localStorage.getItem('push-prompt-dismissed')
            if (!hasDismissed) {
                setShowPrompt(true)
            }
        }
    }, [isLoading, isSupported, isSubscribed, permission])

    const handleEnable = async () => {
        const success = await subscribe()
        if (success) {
            setShowPrompt(false)
        }
    }

    const handleDismiss = () => {
        localStorage.setItem('push-prompt-dismissed', 'true')
        setShowPrompt(false)
    }

    if (!showPrompt) return null

    return (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full shrink-0">
                    <BellRing className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-indigo-900">Enable Browser Notifications</h3>
                    <p className="text-xs text-indigo-700 mt-0.5">Get instantly notified about new tenant payments and maintenance requests.</p>
                </div>
            </div>
            <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
                <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleEnable}>
                    Enable Now
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900" onClick={handleDismiss}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
