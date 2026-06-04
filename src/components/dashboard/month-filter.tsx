"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"

export function MonthFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const currentMonth = searchParams.get("month") || "all"

    const today = new Date()
    
    // Generate options: Current month, and past 5 months
    const options = []
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
        options.push({ value: val, label })
    }

    function handleChange(val: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (val === "all") {
            params.delete("month")
        } else {
            params.set("month", val)
        }
        
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-white rounded-md border shadow-sm">
            <div className="pl-3 py-2 border-r text-muted-foreground bg-slate-50 rounded-l-md">
                <CalendarIcon className="h-4 w-4" />
            </div>
            <Select value={currentMonth} onValueChange={handleChange}>
                <SelectTrigger className="w-[180px] border-0 focus:ring-0 shadow-none font-medium">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="font-bold text-blue-600">Up to date (All-Time)</SelectItem>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
