"use client"

import { useState, useEffect } from "react"
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
import { Plus } from "lucide-react"
import { createFlat } from "@/lib/actions/flat"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const FLAT_TYPES = [
    { value: "STUDIO", label: "Studio" },
    { value: "BHK1", label: "1 BHK" },
    { value: "BHK2", label: "2 BHK" },
    { value: "BHK3", label: "3 BHK" },
    { value: "OTHER", label: "Other" },
]

interface AddFlatDialogProps {
    buildingId: string
    floors: { id: string; number: number }[]
    defaultRents?: { BHK1: number; BHK2: number; BHK3: number }
}

export function AddFlatDialog({ buildingId, floors, defaultRents }: AddFlatDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const [floorId, setFloorId] = useState("")
    const [flatNumber, setFlatNumber] = useState("")
    const [flatType, setFlatType] = useState("BHK1")
    const [rentAmount, setRentAmount] = useState("")
    const [maintenanceAmount, setMaintenanceAmount] = useState("")

    // Auto-fill rent when flat type changes
    useEffect(() => {
        if (defaultRents) {
            if (flatType === "BHK1") setRentAmount(defaultRents.BHK1.toString())
            else if (flatType === "BHK2") setRentAmount(defaultRents.BHK2.toString())
            else if (flatType === "BHK3") setRentAmount(defaultRents.BHK3.toString())
        }
    }, [flatType, defaultRents])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!floorId) {
            setError("Please select a floor")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await createFlat({
                buildingId,
                floorId,
                flatNumber,
                flatType: flatType as any,
                rentAmount: parseFloat(rentAmount),
                maintenanceAmount: parseFloat(maintenanceAmount)
            })

            setLoading(false)

            if (result.error) {
                setError(result.error)
            } else {
                toast.success(`Flat ${flatNumber} added successfully!`)
                setOpen(false)
                setFloorId("")
                setFlatNumber("")
                setRentAmount("")
                setMaintenanceAmount("")
                setFlatType("BHK1")
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Flat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Flat</DialogTitle>
                        <DialogDescription>
                            Add a new flat. Select the floor, type, and details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Floor Selection */}
                        <div className="space-y-2">
                            <Label>Floor</Label>
                            {floors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {floors.map((floor) => (
                                        <Button
                                            key={floor.id}
                                            type="button"
                                            variant={floorId === floor.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setFloorId(floor.id)}
                                        >
                                            Floor {floor.number}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No floors found. Please add floors first.
                                </p>
                            )}
                        </div>

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
                                placeholder="e.g., 101"
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
                                placeholder="12000"
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
                                placeholder="1500"
                                className="col-span-3"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || floors.length === 0}>
                            {loading ? "Adding..." : "Add Flat"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
