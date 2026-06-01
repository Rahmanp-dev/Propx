"use client"

import { Button } from "@/components/ui/button"
import { verifySubscriptionPayment } from "@/lib/actions/super-admin"
import { CheckCircle, XCircle } from "lucide-react"
import { useTransition } from "react"
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
import { useState } from "react"

export function PaymentActionButtons({ paymentId }: { paymentId: string }) {
    const [isPending, startTransition] = useTransition()
    const [rejectOpen, setRejectOpen] = useState(false)
    const [notes, setNotes] = useState("")

    const handleVerify = () => {
        startTransition(async () => {
            await verifySubscriptionPayment(paymentId, 'VERIFIED')
        })
    }

    const handleReject = () => {
        startTransition(async () => {
            await verifySubscriptionPayment(paymentId, 'REJECTED', notes)
            setRejectOpen(false)
            setNotes("")
        })
    }

    return (
        <div className="flex items-center gap-2 justify-end">
            <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={handleVerify}
                disabled={isPending}
            >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verify
            </Button>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isPending}
                    >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this payment? Provide a reason for rejection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Reason for rejection</Label>
                            <Input
                                id="notes"
                                placeholder="e.g., Screenshot unclear, amount mismatch..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
