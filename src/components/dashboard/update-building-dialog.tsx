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
import { Settings } from "lucide-react"
import { updateBuildingSettings } from "@/lib/actions/building-settings"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface UpdateBuildingDialogProps {
    buildingId: string
    currentRate: number
    buildingName: string
    totalFloors: number
    defaultRents?: { BHK1: number; BHK2: number; BHK3: number }
}

export function UpdateBuildingDialog({ buildingId, currentRate, buildingName, totalFloors, defaultRents }: UpdateBuildingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rate, setRate] = useState(currentRate.toString())
    const [floors, setFloors] = useState(totalFloors.toString())
    const [rent1, setRent1] = useState((defaultRents?.BHK1 ?? 8000).toString())
    const [rent2, setRent2] = useState((defaultRents?.BHK2 ?? 12000).toString())
    const [rent3, setRent3] = useState((defaultRents?.BHK3 ?? 16000).toString())
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await updateBuildingSettings({
                buildingId,
                ratePerUnit: parseFloat(rate),
                totalFloors: parseInt(floors),
                defaultRentBHK1: parseFloat(rent1),
                defaultRentBHK2: parseFloat(rent2),
                defaultRentBHK3: parseFloat(rent3),
            })

            setLoading(false)

            if (!res.success && res.error) {
                setError(res.error)
            } else if (res.success) {
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
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Building Settings</DialogTitle>
                        <DialogDescription>
                            Configure settings for {buildingName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rate" className="text-right">
                                Elec. Rate (₹/Unit)
                            </Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.01"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="floors" className="text-right">
                                Total Floors
                            </Label>
                            <Input
                                id="floors"
                                type="number"
                                min="1"
                                value={floors}
                                onChange={(e) => setFloors(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <Separator />
                        <p className="text-sm font-medium text-muted-foreground">Default Rent Structure</p>

                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border">
                            <div>
                                <Label className="text-xs">1 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent1}
                                    onChange={(e) => setRent1(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">2 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent2}
                                    onChange={(e) => setRent2(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">3 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent3}
                                    onChange={(e) => setRent3(e.target.value)}
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center mt-2">{error}</p>
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
