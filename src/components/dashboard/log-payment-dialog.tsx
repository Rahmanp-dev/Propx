"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Banknote } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { logPayment } from "@/lib/actions/payment"

interface LogPaymentDialogProps {
    payment: {
        id: string
        totalDue: number
        balance: number
        rentDue?: number
        maintenanceDue?: number
        electricityDue?: number
        arrears?: number
        status?: string
    }
    asIcon?: boolean
}

export function LogPaymentDialog({ payment, asIcon }: LogPaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const [amount, setAmount] = useState(payment.balance)
    const [method, setMethod] = useState("CASH")
    const [upiReference, setUpiReference] = useState("")
    const [notes, setNotes] = useState("")
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await logPayment({
                paymentId: payment.id,
                amount: Number(amount),
                method: method as any,
                ...(method === "UPI" && upiReference ? { upiReference } : {}),
                ...(notes.trim() ? { notes: notes.trim() } : {}),
                paymentDate: paymentDate
            })

            setLoading(false)

            if (result.success) {
                toast.success("Payment logged successfully!")
                setOpen(false)
                window.location.reload()
            } else {
                console.error("Server Action returned error:", result.error)
                setError(result.error || "Failed to log payment")
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
                {asIcon ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Banknote className="h-4 w-4" />
                        <span className="sr-only">Log Payment</span>
                    </Button>
                ) : (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Banknote className="mr-2 h-4 w-4" /> Collect
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for this month.
                        Balance Pending: <span className="font-bold text-red-500">₹{payment.balance}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="amount">Amount Received</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="paymentDate">Collection Date</Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {method === "UPI" && (
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="upiReference">UPI Reference (Optional)</Label>
                            <Input
                                id="upiReference"
                                value={upiReference}
                                onChange={(e) => setUpiReference(e.target.value)}
                                placeholder="e.g. 123456789012"
                            />
                        </div>
                    )}

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="notes">Remarks/Notes (Optional)</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Paid in cash to building manager..."
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Confirming..." : "Confirm Payment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
