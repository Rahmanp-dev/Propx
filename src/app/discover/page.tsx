import { getDiscoverBuildings } from "@/lib/actions/discover"
import { DiscoverClient } from "./discover-client"
import Link from "next/link"
import { Building2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata = {
    title: "PropX Discover — Find Verified Flats for Rent",
    description: "Browse verified, professionally managed rental flats in Hyderabad. Map-based discovery, transparent pricing, building rules upfront. Powered by PropX.",
}

export default async function DiscoverPage() {
    const result = await getDiscoverBuildings()
    const buildings = result.success ? result.data ?? [] : []

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold tracking-tight">
                                Prop<span className="text-indigo-400">X</span>
                            </span>
                            <span className="hidden sm:inline text-xs text-orange-400 font-semibold ml-2 px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20">
                                Discover
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm text-slate-400 hover:text-white transition-colors font-medium hidden sm:block"
                        >
                            Owner Login
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                        >
                            List Your Building
                        </Link>
                    </div>
                </div>
            </header>

            {/* Client-side interactive content */}
            <DiscoverClient buildings={buildings} />
        </div>
    )
}
