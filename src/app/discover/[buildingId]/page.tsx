import { getDiscoverBuildingDetail } from "@/lib/actions/discover"
import { BuildingDetailClient } from "./building-detail-client"
import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ buildingId: string }> }) {
    const { buildingId } = await params
    const result = await getDiscoverBuildingDetail(buildingId)
    if (!result.success || !result.data) {
        return { title: "Building Not Found — PropX Discover" }
    }
    const b = result.data
    return {
        title: `${b.name} — Flats for Rent | PropX Discover`,
        description: `${b.vacantCount} flat${b.vacantCount !== 1 ? 's' : ''} available in ${b.name}, ${b.address}. ${b.rentRange ? `Rent from ₹${b.rentRange.min.toLocaleString('en-IN')}` : ''}. Managed on PropX.`,
        openGraph: {
            title: `${b.name} — PropX Discover`,
            description: `Verified rental flats available. Professional management by PropX.`,
        },
    }
}

export default async function BuildingDetailPage({ params, searchParams }: {
    params: Promise<{ buildingId: string }>
    searchParams: Promise<{ utm_source?: string }>
}) {
    const { buildingId } = await params
    const { utm_source } = await searchParams
    const result = await getDiscoverBuildingDetail(buildingId)

    if (!result.success || !result.data) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/discover" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Map</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10 hidden sm:block" />
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold">
                                Prop<span className="text-indigo-400">X</span>
                                <span className="text-orange-400 ml-1 text-xs font-semibold">Discover</span>
                            </span>
                        </Link>
                    </div>

                    <Link
                        href="/register"
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                    >
                        List Your Building
                    </Link>
                </div>
            </header>

            <BuildingDetailClient building={result.data} utmSource={utm_source || null} />
        </div>
    )
}
