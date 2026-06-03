"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MonthPicker({ currentMonth }: { currentMonth: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMonth = e.target.value
        if (!newMonth) return

        const params = new URLSearchParams(searchParams.toString())
        params.set("month", newMonth)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 print-hide">
            <Label htmlFor="month-picker" className="whitespace-nowrap">Select Month:</Label>
            <Input 
                id="month-picker"
                type="month" 
                value={currentMonth} 
                onChange={handleMonthChange}
                className="w-40 h-9"
            />
        </div>
    )
}
