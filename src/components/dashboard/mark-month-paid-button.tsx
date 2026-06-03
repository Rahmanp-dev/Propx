"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { markAllMonthAsPaid } from "@/lib/actions/payment"
import { useRouter } from "next/navigation"

export function MarkMonthPaidButton({ currentMonth }: { currentMonth: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleMarkAsPaid = async () => {
        if (!confirm(`Are you sure you want to mark ALL pending dues for ${currentMonth} as PAID (via CASH)?`)) return

        setLoading(true)
        const result = await markAllMonthAsPaid(currentMonth, "CASH")
        setLoading(false)

        if (result.success) {
            toast.success(`Marked ${result.count} payments as paid successfully.`)
            router.refresh()
        } else {
            toast.error(result.error || "Failed to mark payments as paid")
        }
    }

    return (
        <Button onClick={handleMarkAsPaid} disabled={loading} className="bg-green-600 hover:bg-green-700 gap-2 print-hide" size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark Month as Paid
        </Button>
    )
}
