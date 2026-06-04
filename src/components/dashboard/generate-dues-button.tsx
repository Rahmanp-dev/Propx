"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play } from "lucide-react"
import { generateMonthlyDues } from "@/lib/actions/rental-engine"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function GenerateDuesButton() {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [monthOffset, setMonthOffset] = useState("0")
    const router = useRouter()

    async function handleGenerate() {
        setLoading(true)
        try {
            const result = await generateMonthlyDues(parseInt(monthOffset))

            if (result.success) {
                toast.success(`Generated dues for ${result.count} tenants`, {
                    description: result.count === 0
                        ? "All tenants already have dues for this month."
                        : "Payment records created. Finance dashboard updated.",
                })
                router.refresh()
                setOpen(false)
            } else {
                toast.error("Failed to generate dues", { description: result.error })
            }
        } catch (err) {
            toast.error("Something went wrong")
        }
        setLoading(false)
    }

    const today = new Date();
    const currentMonthLabel = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthLabel = prevDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Generate Monthly Dues
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Monthly Dues</DialogTitle>
                    <DialogDescription>
                        Select the billing month you want to generate invoices for. 
                        If you bill at the end of the month, select the previous month.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Select value={monthOffset} onValueChange={setMonthOffset}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select billing month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="-1">Previous Month ({prevMonthLabel})</SelectItem>
                            <SelectItem value="0">Current Month ({currentMonthLabel})</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Generate Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
