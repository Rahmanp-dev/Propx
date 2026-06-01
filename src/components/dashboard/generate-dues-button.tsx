"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play } from "lucide-react"
import { generateMonthlyDues } from "@/lib/actions/rental-engine"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function GenerateDuesButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleGenerate() {
        setLoading(true)
        try {
            const result = await generateMonthlyDues()

            if (result.success) {
                toast.success(`Generated dues for ${result.count} tenants`, {
                    description: result.count === 0
                        ? "All tenants already have dues for this month."
                        : "Payment records created. Finance dashboard updated.",
                })
                router.refresh()
            } else {
                toast.error("Failed to generate dues", { description: result.error })
            }
        } catch (err) {
            toast.error("Something went wrong")
        }
        setLoading(false)
    }

    return (
        <Button onClick={handleGenerate} disabled={loading} variant="outline" size="sm">
            {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Play className="mr-2 h-4 w-4" />
            )}
            Generate Monthly Dues
        </Button>
    )
}
