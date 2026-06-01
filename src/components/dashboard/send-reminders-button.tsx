"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Send } from "lucide-react"
import { sendRentReminders } from "@/lib/actions/whatsapp"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SendRemindersButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSend() {
        setLoading(true)
        try {
            const result = await sendRentReminders()
            if (result.success) {
                toast.success(`Rent reminders sent to ${result.data?.count ?? 0} tenants`)
                router.refresh()
            } else {
                toast.error((result as any).error || "Failed to send rent reminders")
            }
        } catch {
            toast.error("An error occurred while sending reminders")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleSend} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Send className="mr-2 h-4 w-4" />
            )}
            Send Rent Reminders
        </Button>
    )
}
