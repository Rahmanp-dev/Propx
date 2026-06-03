"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { sendWhatsAppNotification } from "@/lib/actions/whatsapp"

export function WhatsAppButton({ paymentId, phone, type, tenantName }: { paymentId: string, phone: string, type: 'INVOICE' | 'RECEIPT', tenantName: string }) {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    async function handleSend() {
        if (!phone) {
            toast.error("No phone number on file for this tenant.")
            return
        }

        setLoading(true)
        const result = await sendWhatsAppNotification(paymentId, type)
        setLoading(false)

        if (result.success) {
            setSent(true)
            toast.success(`WhatsApp ${type.toLowerCase()} sent to ${tenantName}!`)
        } else {
            toast.error(result.error || "Failed to send WhatsApp message")
        }
    }

    return (
        <Button 
            variant={sent ? "secondary" : "default"} 
            size="sm" 
            className={`w-full text-[10px] h-6 mt-2 print:hidden ${type === 'INVOICE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={handleSend}
            disabled={loading || sent}
        >
            {sent ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</>
            ) : (
                <><Send className="w-3 h-3 mr-1" /> Send {type === 'INVOICE' ? 'Reminder' : 'Receipt'}</>
            )}
        </Button>
    )
}
