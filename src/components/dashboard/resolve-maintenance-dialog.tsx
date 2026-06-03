"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

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
import { updateMaintenanceStatus } from "@/lib/actions/maintenance"

interface ResolveMaintenanceDialogProps {
    requestId: string
    currentStatus: string
}

export function ResolveMaintenanceDialog({ requestId, currentStatus }: ResolveMaintenanceDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const [cost, setCost] = useState("")
    const [notes, setNotes] = useState("")

    if (currentStatus === "RESOLVED" || currentStatus === "CLOSED") {
        return null
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const numericCost = cost ? parseFloat(cost) : 0

            const result = await updateMaintenanceStatus(
                requestId,
                "RESOLVED",
                notes,
                numericCost
            )

            setLoading(false)

            if (result.success) {
                toast.success("Request resolved successfully!")
                setOpen(false)
                router.refresh()
            } else {
                setError(result.error || "Failed to resolve request")
            }
        } catch (err) {
            setLoading(false)
            setError("An unexpected error occurred.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 w-full mt-2">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve Ticket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Resolve Maintenance Request</DialogTitle>
                    <DialogDescription>
                        Mark this ticket as resolved. You can optionally log the final repair cost and notes for the ledger.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="cost">Repair Cost (₹) (Optional)</Label>
                        <Input
                            id="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="notes">Resolution Notes (Optional)</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Replaced the faulty valve..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? "Resolving..." : "Confirm Resolution"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
