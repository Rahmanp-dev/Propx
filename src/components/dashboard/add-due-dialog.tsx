"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle } from "lucide-react"
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
import { addCustomDue } from "@/lib/actions/due"

interface AddDueDialogProps {
    tenantId: string
    currentMonth: Date
}

export function AddDueDialog({ tenantId, currentMonth }: AddDueDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [label, setLabel] = useState("")
    const [amount, setAmount] = useState<number | "">("")
    const router = useRouter()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!label || !amount) return

        setLoading(true)
        setError("")

        try {
            const result = await addCustomDue({
                tenantId,
                label,
                amount: Number(amount),
                month: new Date(currentMonth)
            })

            setLoading(false)

            if (result.success) {
                toast.success("Custom due added successfully!")
                setOpen(false)
                setLabel("")
                setAmount("")
                router.refresh()
            } else {
                setError(result.error || "Failed to add due")
            }
        } catch (err) {
            setLoading(false)
            setError("An unexpected error occurred. Please check your connection.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Due
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Custom Due</DialogTitle>
                    <DialogDescription>
                        Add a fine, repair cost, or any other custom due for this month.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="label">Reason / Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Broken window repair"
                            required
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            placeholder="0"
                            min="1"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !label || !amount}>
                            {loading ? "Adding..." : "Add Due"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
