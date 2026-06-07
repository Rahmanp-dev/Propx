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
import { toast } from "sonner"
import { ImageUploadClient } from "@/components/shared/image-upload-client"

interface UpdateBuildingDialogProps {
    buildingId: string
    currentRate: number
    buildingName: string
    currentAddress: string
    currentLatitude?: number | null
    currentLongitude?: number | null
    totalFloors: number
    defaultRents?: { BHK1: number; BHK2: number; BHK3: number }
    discoverEnabled?: boolean
    discoverBio?: string | null
    contactWhatsApp?: string | null
    photos?: string[]
}

export function UpdateBuildingDialog({
    buildingId,
    currentRate,
    buildingName,
    currentAddress,
    currentLatitude = null,
    currentLongitude = null,
    totalFloors,
    defaultRents,
    discoverEnabled = false,
    discoverBio = "",
    contactWhatsApp = "",
    photos = [],
}: UpdateBuildingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(buildingName)
    const [address, setAddress] = useState(currentAddress)
    const [latitude, setLatitude] = useState(currentLatitude?.toString() || "")
    const [longitude, setLongitude] = useState(currentLongitude?.toString() || "")
    const [rate, setRate] = useState(currentRate.toString())
    const [floors, setFloors] = useState(totalFloors.toString())
    const [rent1, setRent1] = useState((defaultRents?.BHK1 ?? 8000).toString())
    const [rent2, setRent2] = useState((defaultRents?.BHK2 ?? 12000).toString())
    const [rent3, setRent3] = useState((defaultRents?.BHK3 ?? 16000).toString())
    const [isDiscoverEnabled, setIsDiscoverEnabled] = useState(discoverEnabled)
    const [bio, setBio] = useState(discoverBio || "")
    const [whatsapp, setWhatsapp] = useState(contactWhatsApp || "")
    const [buildingPhotos, setBuildingPhotos] = useState<string[]>(photos)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await updateBuildingSettings({
                buildingId,
                name,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                ratePerUnit: parseFloat(rate),
                totalFloors: parseInt(floors),
                defaultRentBHK1: parseFloat(rent1),
                defaultRentBHK2: parseFloat(rent2),
                defaultRentBHK3: parseFloat(rent3),
                discoverEnabled: isDiscoverEnabled,
                discoverBio: bio,
                contactWhatsApp: whatsapp,
                photos: buildingPhotos,
            })

            setLoading(false)

            if (!res.success && res.error) {
                setError(res.error)
            } else if (res.success) {
                toast.success("Building settings updated successfully!")
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
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Building Settings</DialogTitle>
                        <DialogDescription>
                            Configure name, address, coordinates, and pricing defaults for {buildingName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Name and Address */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Address</Label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Building Photos */}
                        <Separator />
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Building Photos</p>
                            <ImageUploadClient 
                                images={buildingPhotos} 
                                onChange={setBuildingPhotos} 
                                maxImages={8} 
                            />
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-4 border p-2.5 rounded-lg bg-slate-50">
                            <div>
                                <Label className="text-xs">Latitude (optional)</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    placeholder="e.g. 17.3850"
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Longitude (optional)</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    placeholder="e.g. 78.4867"
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                        </div>

                        <Separator />

                        <p className="text-sm font-medium text-slate-700">PropX Discover (Marketing)</p>
                        
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="discoverEnabled"
                                checked={isDiscoverEnabled}
                                onChange={(e) => setIsDiscoverEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <Label htmlFor="discoverEnabled" className="font-semibold text-orange-600">
                                Show building on PropX Discover
                            </Label>
                        </div>

                        {isDiscoverEnabled && (
                            <div className="grid gap-3 bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                <div>
                                    <Label htmlFor="bio" className="text-xs">Building Bio / Description</Label>
                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                        placeholder="E.g. A premium family-friendly apartment building..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="whatsapp" className="text-xs">Contact WhatsApp (optional)</Label>
                                    <Input
                                        id="whatsapp"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="h-8 text-xs mt-1"
                                        placeholder="e.g. +919876543210"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rate" className="text-right">
                                Elec. Rate (₹/U)
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
                        <p className="text-sm font-medium text-slate-700">Default Rent Structure</p>

                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border">
                            <div>
                                <Label className="text-xs">1 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent1}
                                    onChange={(e) => setRent1(e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">2 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent2}
                                    onChange={(e) => setRent2(e.target.value)}
                                    className="h-8 text-xs mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">3 BHK (₹)</Label>
                                <Input
                                    type="number"
                                    value={rent3}
                                    onChange={(e) => setRent3(e.target.value)}
                                    className="h-8 text-xs mt-1"
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
