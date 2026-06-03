'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FlatSelector({ flats, flatId, userId }: { flats: any[], flatId?: string, userId: string }) {
    const router = useRouter()

    return (
        <>
            {/* Mobile View: Select Dropdown */}
            <div className="md:hidden">
                <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={flatId || ''}
                    aria-label="Select a flat to view ledger"
                    onChange={(e) => {
                        if (e.target.value) {
                            router.push(`/${userId}/ledger?flatId=${e.target.value}`)
                        }
                    }}
                >
                    <option value="" disabled>Select a flat...</option>
                    {flats?.map(flat => (
                        <option key={flat.id} value={flat.id}>
                            {flat.building.name} - Flat {flat.flatNumber} {flat.tenants.length > 0 ? `(${flat.tenants[0].fullName})` : '(Vacant)'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Desktop View: List of Buttons */}
            <div className="hidden md:flex flex-col space-y-2">
                {flats?.map(flat => (
                    <Link key={flat.id} href={`/${userId}/ledger?flatId=${flat.id}`} className="block">
                        <Button 
                            variant={flat.id === flatId ? "default" : "outline"} 
                            className="w-full justify-start text-left h-auto py-3"
                        >
                            <div>
                                <div className="font-medium">{flat.building.name}</div>
                                <div className="text-xs opacity-80">
                                    Flat {flat.flatNumber} {flat.tenants.length > 0 ? `(${flat.tenants[0].fullName})` : '(Vacant)'}
                                </div>
                            </div>
                        </Button>
                    </Link>
                ))}
                {flats?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No flats found.</div>
                )}
            </div>
        </>
    )
}
