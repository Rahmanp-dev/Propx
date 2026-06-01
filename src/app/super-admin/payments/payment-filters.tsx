"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function PaymentFilters({ currentStatus }: { currentStatus?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set('status', value)
        } else {
            params.delete('status')
        }
        router.push(`/super-admin/payments?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-4 mb-6">
            <Select
                value={currentStatus || "all"}
                onValueChange={updateFilter}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
            </Select>

            {currentStatus && (
                <Button variant="ghost" size="sm" onClick={() => updateFilter('all')}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    )
}
