'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    STUDIO: "Studio",
    OTHER: "Other",
}

export function BuildingFlatsClient({ floors, userId }: { floors: any[]; userId: string }) {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter logic
    const filteredFloors = floors.map(floor => {
        return {
            ...floor,
            flats: floor.flats.filter((flat: any) => 
                flat.flatNumber.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
    }).filter(floor => floor.flats.length > 0) // Hide empty floors

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Floors & Flats</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search flat number..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {filteredFloors.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                        No flats found matching "{searchQuery}"
                    </div>
                ) : (
                    filteredFloors.map((floor) => (
                        <div key={floor.id} className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Floor {floor.number}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {floor.flats.map((flat: any) => (
                                    <FlatTile key={flat.id} flat={flat} userId={userId} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function FlatTile({ flat, userId }: { flat: any; userId: string }) {
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
        <Link href={`/${userId}/flats/${flat.id}`}>
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
