"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { LogPaymentDialog } from "@/components/dashboard/log-payment-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Layers } from "lucide-react"

interface PendingPaymentsTableProps {
    payments: any[]
    userId: string
}

export function PendingPaymentsTable({ payments, userId }: PendingPaymentsTableProps) {
    const [showAll, setShowAll] = useState(false)

    const groupedPayments = useMemo(() => {
        if (!payments) return {}
        
        // Group by floor number then flat number
        const groups: Record<string, any[]> = {}
        
        // Ensure payments are sorted by floor and flat number
        const sorted = [...payments].sort((a, b) => {
            const floorA = a.flat.floor?.number ?? 999
            const floorB = b.flat.floor?.number ?? 999
            if (floorA !== floorB) return floorA - floorB
            
            const flatA = a.flat.flatNumber || ""
            const flatB = b.flat.flatNumber || ""
            return flatA.localeCompare(flatB)
        })
        
        sorted.forEach(payment => {
            const buildingName = payment.flat.building.name
            const floorNum = payment.flat.floor?.number
            const floorKey = floorNum !== undefined ? `${buildingName} - Floor ${floorNum}` : `${buildingName} - Unassigned Floor`
            
            if (!groups[floorKey]) {
                groups[floorKey] = []
            }
            groups[floorKey].push(payment)
        })
        
        return groups
    }, [payments])

    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground border rounded-md bg-slate-50">
                No pending payments found. Good job!
            </div>
        )
    }

    const floorKeys = Object.keys(groupedPayments)
    const displayKeys = showAll ? floorKeys : floorKeys.slice(0, 3) // Show max 3 floors by default
    const hasMore = floorKeys.length > 3

    return (
        <div className="space-y-6">
            {displayKeys.map(floorKey => (
                <div key={floorKey} className="space-y-3">
                    {/* Floor Header */}
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-md border text-sm font-semibold text-slate-700">
                        <Layers className="h-4 w-4 text-slate-500" />
                        {floorKey}
                    </div>
                    
                    {/* Payments for this floor */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupedPayments[floorKey].map(payment => (
                            <div key={payment.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <Link href={`/${userId}/flats/${payment.flatId}`} className="font-bold text-base hover:underline text-blue-600 truncate mr-2">
                                            Flat {payment.flat.flatNumber}
                                        </Link>
                                        <Badge variant="destructive" className="shrink-0">{payment.status}</Badge>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate" title={payment.tenant.fullName}>
                                        {payment.tenant.fullName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                
                                <div className="flex items-end justify-between pt-3 border-t">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Due</p>
                                        <p className="text-lg font-extrabold text-red-600">
                                            ₹{payment.balance.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <LogPaymentDialog payment={payment} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {hasMore && (
                <div className="text-center pt-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAll(!showAll)}
                        className="w-full md:w-auto"
                    >
                        {showAll ? 'Show Less' : `View ${floorKeys.length - 3} More Floors`}
                    </Button>
                </div>
            )}
        </div>
    )
}
