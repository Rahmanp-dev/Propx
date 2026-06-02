"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
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
import { deleteFlat } from "@/lib/actions/flat"

interface DeleteFlatDialogProps {
    flatId: string
    flatNumber: string
}

export function DeleteFlatDialog({ flatId, flatNumber }: DeleteFlatDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        setError("")
        try {
            const result = await deleteFlat(flatId)

            setLoading(false)
            if (result.success) {
                toast.success(`Flat ${flatNumber} deleted successfully!`)
                setOpen(false)
                router.refresh()
            } else {
                console.error("Server Action returned error:", result.error)
                setError(result.error || "Failed to delete flat")
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Flat</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Flat {flatNumber}</DialogTitle>
                    <DialogDescription className="text-red-600 font-medium mt-2">
                        Are you sure you want to delete this flat?
                    </DialogDescription>
                    <div className="bg-red-50 p-3 rounded-md mt-4 text-sm text-red-800">
                        <p className="font-semibold mb-1">Warning: This action cannot be undone.</p>
                        <p>Deleting this flat will also permanently delete:</p>
                        <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                            <li>All tenant records associated with it</li>
                            <li>All payment records and meter readings</li>
                            <li>All maintenance requests</li>
                        </ul>
                    </div>
                </DialogHeader>
                {error && (
                    <p className="text-sm text-red-500 font-medium text-center py-2">{error}</p>
                )}
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? "Deleting..." : "Permanently Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
