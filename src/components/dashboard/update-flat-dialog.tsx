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
import { Pencil } from "lucide-react"
import { updateFlat } from "@/lib/actions/flat"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { ImageUploadClient } from "@/components/shared/image-upload-client"

const FLAT_TYPES = [
    { value: "STUDIO", label: "Studio" },
    { value: "BHK1", label: "1 BHK" },
    { value: "BHK2", label: "2 BHK" },
    { value: "BHK3", label: "3 BHK" },
    { value: "OTHER", label: "Other" },
]

interface UpdateFlatDialogProps {
    flatId: string
    currentFlatNumber: string
    currentFlatType: string
    currentRentAmount: number
    currentMaintenanceAmount: number
    currentDepositAmount: number
    photos?: string[]
}

export function UpdateFlatDialog({
    flatId,
    currentFlatNumber,
    currentFlatType,
    currentRentAmount,
    currentMaintenanceAmount,
    currentDepositAmount,
    photos = [],
}: UpdateFlatDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const [flatNumber, setFlatNumber] = useState(currentFlatNumber)
    const [flatType, setFlatType] = useState(currentFlatType)
    const [rentAmount, setRentAmount] = useState(currentRentAmount.toString())
    const [maintenanceAmount, setMaintenanceAmount] = useState(currentMaintenanceAmount.toString())
    const [depositAmount, setDepositAmount] = useState(currentDepositAmount.toString())
    const [flatPhotos, setFlatPhotos] = useState<string[]>(photos)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await updateFlat({
                id: flatId,
                flatNumber,
                flatType: flatType as any,
                rentAmount: parseFloat(rentAmount),
                maintenanceAmount: parseFloat(maintenanceAmount),
                depositAmount: parseFloat(depositAmount),
                photos: flatPhotos,
            })

            setLoading(false)

            if (result.error) {
                setError(result.error)
            } else {
                toast.success(`Flat ${flatNumber} updated successfully!`)
                setOpen(false)
                router.refresh()
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
                <Button variant="outline" size="sm" className="h-9 px-3">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Flat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Flat Details</DialogTitle>
                        <DialogDescription>
                            Update properties for flat {currentFlatNumber}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Flat Type */}
                        <div className="space-y-2">
                            <Label>Flat Type</Label>
                            <div className="flex flex-wrap gap-2">
                                {FLAT_TYPES.map((type) => (
                                    <Button
                                        key={type.value}
                                        type="button"
                                        variant={flatType === type.value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFlatType(type.value)}
                                    >
                                        {type.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="flatNumber" className="text-right">Flat #</Label>
                            <Input
                                id="flatNumber"
                                value={flatNumber}
                                onChange={(e) => setFlatNumber(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rent" className="text-right">Rent (₹)</Label>
                            <Input
                                id="rent"
                                type="number"
                                value={rentAmount}
                                onChange={(e) => setRentAmount(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="maintenance" className="text-right">Maint. (₹)</Label>
                            <Input
                                id="maintenance"
                                type="number"
                                value={maintenanceAmount}
                                onChange={(e) => setMaintenanceAmount(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="deposit" className="text-right">Deposit (₹)</Label>
                            <Input
                                id="deposit"
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Flat Photos */}
                        <Separator />
                        <div className="space-y-2">
                            <Label>Flat Photos</Label>
                            <ImageUploadClient 
                                images={flatPhotos} 
                                onChange={setFlatPhotos} 
                                maxImages={5} 
                            />
                        </div>
                        
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
