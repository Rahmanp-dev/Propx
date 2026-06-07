import { getBuildingDetails } from "@/lib/actions/building-details"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AddFlatDialog } from "@/components/dashboard/add-flat-dialog"
import { UpdateBuildingDialog } from "@/components/dashboard/update-building-dialog"
import { DeleteBuildingDialog } from "@/components/dashboard/delete-building-dialog"
import { BuildingFlatsClient } from "@/components/dashboard/building-flats-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, IndianRupee, Shield, Eye } from "lucide-react"

export const dynamic = 'force-dynamic'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    STUDIO: "Studio",
    OTHER: "Other",
}

export default async function BuildingPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
    const { id, userId } = await params
    const { data: building, error } = await getBuildingDetails(id)

    if (error || !building) {
        return <div className="p-8 text-center text-muted-foreground">Building not found. Please check the ID or try again.</div>
    }

    const totalFlats = building.totalFlats
    const occupied = building.floors.reduce((acc, floor) =>
        acc + floor.flats.filter(f => f.status === "OCCUPIED").length, 0
    )
    const occupancyRate = totalFlats > 0 ? Math.round((occupied / totalFlats) * 100) : 0

    const floorsForDialog = building.floors.map(f => ({ id: f.id, number: f.number }))

    // Extract default rents from building
    const bld = building as any
    const defaultRents = {
        BHK1: bld.defaultRentBHK1 || 8000,
        BHK2: bld.defaultRentBHK2 || 12000,
        BHK3: bld.defaultRentBHK3 || 16000,
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{building.name}</h1>
                    <p className="text-sm md:text-base text-muted-foreground">{building.address}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/${userId}/buildings/${id}/clauses`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                    >
                        <Shield className="h-4 w-4" />
                        Clauses
                    </Link>
                    <Link
                        href={`/discover/${id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        Discover
                    </Link>
                    <UpdateBuildingDialog
                        buildingId={id}
                        currentRate={bld.ratePerUnit || 10}
                        buildingName={building.name}
                        currentAddress={building.address}
                        currentLatitude={bld.latitude}
                        currentLongitude={bld.longitude}
                        totalFloors={building.totalFloors}
                        defaultRents={defaultRents}
                        discoverEnabled={building.discoverEnabled}
                        discoverBio={building.discoverBio}
                        contactWhatsApp={building.contactWhatsApp}
                        photos={bld.photos}
                    />
                    <DeleteBuildingDialog buildingId={id} buildingName={building.name} />
                    <AddFlatDialog buildingId={id} floors={floorsForDialog} defaultRents={defaultRents} />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 border rounded-lg bg-card shadow">
                    <div className="text-sm font-medium text-muted-foreground">Occupancy</div>
                    <div className="text-2xl font-bold">{occupancyRate}%</div>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow">
                    <div className="text-sm font-medium text-muted-foreground">Total Flats</div>
                    <div className="text-2xl font-bold">{totalFlats}</div>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow">
                    <div className="text-sm font-medium text-muted-foreground">Vacant</div>
                    <div className="text-2xl font-bold text-amber-500">{totalFlats - occupied}</div>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" /> Elec. Rate</div>
                    <div className="text-2xl font-bold">₹{bld.ratePerUnit || 10}/u</div>
                </div>
                <div className="p-4 border rounded-lg bg-card shadow">
                    <div className="text-sm font-medium text-muted-foreground">Floors</div>
                    <div className="text-2xl font-bold">{building.totalFloors}</div>
                </div>
            </div>

            {/* Rent Structure Card */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" /> Default Rent Structure
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xs text-muted-foreground">1 BHK</div>
                            <div className="text-lg font-bold">₹{defaultRents.BHK1.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-lg">
                            <div className="text-xs text-muted-foreground">2 BHK</div>
                            <div className="text-lg font-bold">₹{defaultRents.BHK2.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-muted-foreground">3 BHK</div>
                            <div className="text-lg font-bold">₹{defaultRents.BHK3.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <BuildingFlatsClient floors={building.floors} userId={userId} />
        </div>
    )
}
