import { getBuildingClauses } from "@/lib/actions/clauses"
import { getBuildingDetails } from "@/lib/actions/building-details"
import { ClausesManager } from "./clauses-manager"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function BuildingClausesPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
    const { id, userId } = await params
    const [buildingResult, clausesResult] = await Promise.all([
        getBuildingDetails(id),
        getBuildingClauses(id),
    ])

    if (buildingResult.error || !buildingResult.data) {
        return <div className="p-8 text-center text-muted-foreground">Building not found.</div>
    }

    const clauses = clausesResult.success ? clausesResult.data ?? [] : []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href={`/${userId}/buildings/${id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {buildingResult.data.name}
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Building Rules & Clauses</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define rules for your building that tenants must acknowledge before moving in.
                        These are displayed publicly on PropX Discover.
                    </p>
                </div>
            </div>

            <ClausesManager
                buildingId={id}
                initialClauses={clauses}
                userId={userId}
            />
        </div>
    )
}
