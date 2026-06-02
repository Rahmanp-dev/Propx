import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Users, AlertTriangle } from "lucide-react"

// Define a type for the stats based on what we get from Prisma
interface BuildingStats {
    id: string
    name: string
    address: string
    totalFlats: number
    occupiedFlats: number
    totalRevenue: number
    collectedRevenue: number
}

// Ensure totalFlats is at least 1 to avoid division by zero
const calculateOccupancy = (occupied: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
}

export function BuildingCard({ building, userId }: { building: BuildingStats; userId: string }) {
    const occupancy = calculateOccupancy(building.occupiedFlats, building.totalFlats)
    const outstanding = building.totalRevenue - building.collectedRevenue

    return (
        <Link href={`/${userId}/buildings/${building.id}`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">{building.name}</CardTitle>
                    <BuildingIcon occupancy={occupancy} />
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground mb-4">{building.address}</div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
                            <div className="text-2xl font-bold">{occupancy}%</div>
                            <Progress value={occupancy} className="h-2 mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">{building.occupiedFlats}/{building.totalFlats} Flats</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                            <div className="text-2xl font-bold">₹{building.collectedRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                of ₹{building.totalRevenue.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {outstanding > 0 && (
                        <div className="flex items-center text-red-500 bg-red-50 p-2 rounded-md">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-bold">₹{outstanding.toLocaleString()} Pending</span>
                        </div>
                    )}
                    {outstanding === 0 && (
                        <div className="flex items-center text-green-600 bg-green-50 p-2 rounded-md">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span className="text-sm font-bold">All Paid</span>
                        </div>
                    )}

                </CardContent>
            </Card>
        </Link>
    )
}

function BuildingIcon({ occupancy }: { occupancy: number }) {
    // Color coding indicator based on occupancy
    let color = "text-green-500"
    if (occupancy < 50) color = "text-red-500"
    else if (occupancy < 80) color = "text-yellow-500"

    return <Users className={`h-4 w-4 ${color}`} />
}
