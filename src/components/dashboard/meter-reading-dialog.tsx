"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap } from "lucide-react"
import { recordMeterReading, getFlatReadings } from "@/lib/actions/meter-reading"
import { useEffect, useMemo } from "react"

interface MeterReadingDialogProps {
    flatId: string
    flatNumber: string
}

export function MeterReadingDialog({ flatId, flatNumber }: MeterReadingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [reading, setReading] = useState("")

    // Default to current month
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth().toString())
    const [year, setYear] = useState(today.getFullYear().toString())

    const [readings, setReadings] = useState<any[]>([])

    // Fetch previous readings on mount
    // Fetch previous readings on mount

    useEffect(() => {
        if (open) {
            getFlatReadings(flatId).then(res => {
                if (res.success) setReadings(res.data || [])
            })
        }
    }, [open, flatId])

    const selectedMonth = parseInt(month)
    const selectedYear = parseInt(year)

    // Calculate Previous Month
    const prevDate = new Date(selectedYear, selectedMonth - 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()

    const previousReading = useMemo(() => {
        return readings.find(r => r.month === prevMonth && r.year === prevYear)
    }, [readings, prevMonth, prevYear])

    const consumption = reading ? (parseFloat(reading) - (previousReading?.reading || 0)).toFixed(2) : "-"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await recordMeterReading({
                flatId,
                reading: parseFloat(reading),
                month: parseInt(month),
                year: parseInt(year)
            })

            setLoading(false)

            if (result && result.error) {
                console.error("Server Action returned error:", result.error)
                setError(result.error)
            } else {
                setOpen(false)
                setReading("")
            }
        } catch (err) {
            setLoading(false)
            console.error("Fetch/Network error:", err)
            setError("An unexpected error occurred. Please check your connection.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Meter</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Record Meter Reading</DialogTitle>
                        <DialogDescription>
                            Enter electricity meter reading for Flat {flatNumber}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Period</Label>
                            <div className="col-span-3 flex gap-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reading" className="text-right">
                                Reading
                            </Label>
                            <Input
                                id="reading"
                                type="number"
                                step="0.01"
                                value={reading}
                                onChange={(e) => setReading(e.target.value)}
                                placeholder="e.g. 1540.5"
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Comparison Display */}
                        <div className="rounded-md bg-muted p-3 text-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Previous ({new Date(0, prevMonth).toLocaleString('default', { month: 'short' })} '{prevYear.toString().slice(-2)}):</span>
                                <span className="font-medium">{previousReading?.reading ?? "0"}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-semibold">Calculated Consumption:</span>
                                <span className={`font-bold ${parseFloat(consumption) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {consumption} Units
                                </span>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Reading"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
