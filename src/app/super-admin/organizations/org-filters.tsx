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

export function OrgFilters({
    currentStatus,
    currentPlan,
}: {
    currentStatus?: string
    currentPlan?: string
}) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/super-admin/organizations?${params.toString()}`)
    }

    const clearFilters = () => {
        router.push('/super-admin/organizations')
    }

    const hasFilters = currentStatus || currentPlan

    return (
        <div className="flex items-center gap-4 mb-6">
            <Select
                value={currentStatus || "all"}
                onValueChange={(value) => updateFilter('status', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={currentPlan || "all"}
                onValueChange={(value) => updateFilter('plan', value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="BUILDER">Builder</SelectItem>
                    <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                </SelectContent>
            </Select>

            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    )
}
