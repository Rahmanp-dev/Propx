"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IndianRupee, RefreshCw } from "lucide-react"
import { createPaymentLink } from "@/lib/actions/payment-gateway"

export function PayButton({ paymentId, amount }: { paymentId: string; amount: number }) {
    const [loading, setLoading] = useState(false)

    async function handlePay() {
        setLoading(true)
        try {
            const result = await createPaymentLink(paymentId)
            if (result.success && result.paymentUrl) {
                window.location.href = result.paymentUrl
            } else {
                alert(result.error || 'Failed to create payment link')
            }
        } catch {
            alert('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
        >
            {loading ? (
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <IndianRupee className="mr-2 h-5 w-5" />
            )}
            Pay ₹{amount.toLocaleString()} Now
        </Button>
    )
}
