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
import { deleteBuilding } from "@/lib/actions/building"

interface DeleteBuildingDialogProps {
    buildingId: string
    buildingName: string
}

export function DeleteBuildingDialog({ buildingId, buildingName }: DeleteBuildingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        setError("")
        try {
            const result = await deleteBuilding(buildingId)

            setLoading(false)
            if (result.success) {
                toast.success("Building deleted successfully!")
                setOpen(false)
                router.refresh()
                // Redirect if we are on the building page
                if (window.location.pathname.includes(buildingId)) {
                    router.push("/dashboard")
                }
            } else {
                console.error("Server Action returned error:", result.error)
                setError(result.error || "Failed to delete building")
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
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Building
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Building</DialogTitle>
                    <DialogDescription className="text-red-600 font-medium mt-2">
                        Are you absolutely sure you want to delete <strong>{buildingName}</strong>?
                    </DialogDescription>
                    <div className="bg-red-50 p-3 rounded-md mt-4 text-sm text-red-800">
                        <p className="font-semibold mb-1">Warning: This action cannot be undone.</p>
                        <p>Deleting this building will also permanently delete:</p>
                        <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                            <li>All associated flats and floors</li>
                            <li>All tenant records in this building</li>
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
