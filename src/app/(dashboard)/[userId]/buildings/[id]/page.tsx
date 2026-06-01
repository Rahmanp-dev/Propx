import { getBuildingDetails } from "@/lib/actions/building-details"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AddFlatDialog } from "@/components/dashboard/add-flat-dialog"
import { UpdateBuildingDialog } from "@/components/dashboard/update-building-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, IndianRupee } from "lucide-react"

export const dynamic = 'force-dynamic'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    STUDIO: "Studio",
    OTHER: "Other",
}

export default async function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{building.name}</h1>
                    <p className="text-muted-foreground">{building.address}</p>
                </div>
                <div className="flex items-center gap-2">
                    <UpdateBuildingDialog
                        buildingId={id}
                        currentRate={bld.ratePerUnit || 10}
                        buildingName={building.name}
                        totalFloors={building.totalFloors}
                        defaultRents={defaultRents}
                    />
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
                            <div className="text-lg font-bold">₹{defaultRents.BHK1.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-lg">
                            <div className="text-xs text-muted-foreground">2 BHK</div>
                            <div className="text-lg font-bold">₹{defaultRents.BHK2.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-muted-foreground">3 BHK</div>
                            <div className="text-lg font-bold">₹{defaultRents.BHK3.toLocaleString()}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Floors & Flats */}
            <div className="space-y-8">
                <h2 className="text-xl font-semibold">Floors & Flats</h2>
                <div className="space-y-6">
                    {building.floors.map((floor) => (
                        <div key={floor.id} className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Floor {floor.number}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {floor.flats.map((flat) => (
                                    <FlatTile key={flat.id} flat={flat} />
                                ))}
                                {floor.flats.length === 0 && (
                                    <div className="col-span-full py-4 text-sm text-muted-foreground bg-slate-50 rounded-md flex items-center justify-center border border-dashed">
                                        No flats on this floor
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function FlatTile({ flat }: { flat: any }) {
    const isOccupied = flat.status === "OCCUPIED"
    const isMaintenance = flat.status === "UNDER_MAINTENANCE"

    let statusColor = "bg-gray-100 border-gray-200 text-gray-500"
    let statusLabel = "Vacant"

    if (isMaintenance) {
        statusColor = "bg-orange-50 border-orange-200 text-orange-700"
        statusLabel = "Maint."
    } else if (isOccupied) {
        const payment = flat.payments?.[0]
        if (payment && payment.status === "PAID") {
            statusColor = "bg-green-50 border-green-200 text-green-700"
            statusLabel = "Paid"
        } else if (payment && payment.status === "PARTIAL") {
            statusColor = "bg-amber-50 border-amber-200 text-amber-700"
            statusLabel = "Partial"
        } else {
            statusColor = "bg-red-50 border-red-200 text-red-700"
            statusLabel = "Due"
        }
    }

    const typeLabel = FLAT_TYPE_LABELS[flat.flatType] || flat.flatType || ""

    return (
        <Link href={`/flats/${flat.id}`}>
            <div className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer h-28",
                statusColor
            )}>
                <span className="text-lg font-bold">{flat.flatNumber}</span>
                {typeLabel && (
                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">{typeLabel}</span>
                )}
                <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-1.5 bg-white/50 backdrop-blur-sm">
                    {statusLabel}
                </Badge>
            </div>
        </Link>
    )
}
