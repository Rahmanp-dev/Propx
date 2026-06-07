"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Map, List, ChevronUp, ChevronDown } from "lucide-react"

// Leaflet map must be dynamically imported with SSR disabled
const DiscoverMap = dynamic(() => import("./discover-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading map…</span>
            </div>
        </div>
    )
})

export function DiscoverClient({ buildings }: { buildings: any[] }) {
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
    const [filterVacant, setFilterVacant] = useState(false)
    // Mobile: "map" shows the map full-screen, "list" shows the list
    const [mobileView, setMobileView] = useState<"map" | "list">("map")
    // Mobile bottom sheet: collapsed (peek) or expanded
    const [sheetExpanded, setSheetExpanded] = useState(false)

    const filteredBuildings = filterVacant
        ? buildings.filter(b => b.vacantCount > 0)
        : buildings

    return (
        <div className="relative h-[calc(100vh-57px)] lg:h-[calc(100vh-57px)] overflow-hidden">

            {/* ─── DESKTOP LAYOUT (lg+): sidebar + map side by side ─── */}
            <div className="hidden lg:flex h-full">
                {/* Sidebar */}
                <div className="w-[380px] xl:w-[420px] border-r border-white/5 bg-slate-950 flex flex-col h-full z-10">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-lg font-bold mb-3">Available Properties</h2>
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filterVacant}
                                onChange={(e) => setFilterVacant(e.target.checked)}
                                className="rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            Only show available flats
                        </label>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredBuildings.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">No properties found.</p>
                        ) : (
                            filteredBuildings.map(b => (
                                <BuildingCard
                                    key={b.id}
                                    building={b}
                                    isSelected={selectedBuilding === b.id}
                                    onHover={setSelectedBuilding}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 h-full relative bg-slate-900">
                    <DiscoverMap
                        buildings={filteredBuildings}
                        selectedBuilding={selectedBuilding}
                        onBuildingSelect={setSelectedBuilding}
                    />
                </div>
            </div>

            {/* ─── MOBILE LAYOUT (<lg): map-first with bottom sheet ─── */}
            <div className="flex flex-col h-full lg:hidden">

                {/* Mobile Toggle Tabs */}
                <div className="flex border-b border-white/10 bg-slate-950 z-20 shrink-0">
                    <button
                        onClick={() => { setMobileView("map"); setSheetExpanded(false) }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                            mobileView === "map"
                                ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Map className="w-4 h-4" />
                        Map
                    </button>
                    <button
                        onClick={() => setMobileView("list")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                            mobileView === "list"
                                ? "text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5"
                                : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <List className="w-4 h-4" />
                        List ({filteredBuildings.length})
                    </button>
                </div>

                {/* Map View (mobile) */}
                {mobileView === "map" && (
                    <div className="flex-1 relative bg-slate-900">
                        <DiscoverMap
                            buildings={filteredBuildings}
                            selectedBuilding={selectedBuilding}
                            onBuildingSelect={setSelectedBuilding}
                        />

                        {/* Bottom sheet peek: shows count + drag-up handle */}
                        <div
                            className={`absolute bottom-0 left-0 right-0 z-[500] bg-slate-950 border-t border-white/10 rounded-t-2xl transition-all duration-300 ease-in-out ${
                                sheetExpanded ? "h-[60vh]" : "h-auto"
                            }`}
                        >
                            {/* Handle bar */}
                            <button
                                onClick={() => setSheetExpanded(!sheetExpanded)}
                                className="w-full flex flex-col items-center pt-2 pb-1 cursor-pointer"
                            >
                                <div className="w-10 h-1 rounded-full bg-white/20 mb-2" />
                                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                                    {sheetExpanded ? (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            Hide Properties
                                        </>
                                    ) : (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            {filteredBuildings.length} Properties Available
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Sheet content: filter + scrollable cards */}
                            {sheetExpanded && (
                                <div className="flex flex-col h-[calc(60vh-48px)]">
                                    <div className="px-4 py-2 border-b border-white/5">
                                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterVacant}
                                                onChange={(e) => setFilterVacant(e.target.checked)}
                                                className="rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                                            />
                                            Only show available flats
                                        </label>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                        {filteredBuildings.map(b => (
                                            <BuildingCard
                                                key={b.id}
                                                building={b}
                                                isSelected={selectedBuilding === b.id}
                                                onHover={setSelectedBuilding}
                                                compact
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* List View (mobile) */}
                {mobileView === "list" && (
                    <div className="flex-1 overflow-y-auto bg-slate-950">
                        <div className="px-4 py-3 border-b border-white/5 sticky top-0 bg-slate-950 z-10">
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterVacant}
                                    onChange={(e) => setFilterVacant(e.target.checked)}
                                    className="rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500/20"
                                />
                                Only show available flats
                            </label>
                        </div>
                        <div className="p-4 space-y-3">
                            {filteredBuildings.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No properties found.</p>
                            ) : (
                                filteredBuildings.map(b => (
                                    <BuildingCard
                                        key={b.id}
                                        building={b}
                                        isSelected={selectedBuilding === b.id}
                                        onHover={setSelectedBuilding}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─── Reusable Building Card ─── */
function BuildingCard({
    building: b,
    isSelected,
    onHover,
    compact = false,
}: {
    building: any
    isSelected: boolean
    onHover: (id: string | null) => void
    compact?: boolean
}) {
    return (
        <Link href={`/discover/${b.id}`}>
            <div
                onMouseEnter={() => onHover(b.id)}
                onMouseLeave={() => onHover(null)}
                onTouchStart={() => onHover(b.id)}
                className={`${compact ? "p-3" : "p-4"} rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                        : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
            >
                <h3 className={`font-bold text-white ${compact ? "text-sm" : "text-base"}`}>{b.name}</h3>
                <p className={`text-slate-400 mt-0.5 ${compact ? "text-[11px] mb-2" : "text-xs mb-3"}`}>{b.address}</p>

                <div className="flex items-center gap-2 mb-2">
                    {b.vacantCount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            {b.vacantCount} Vacant
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                            Fully Occupied
                        </span>
                    )}
                    {b.clauseCount > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            {b.clauseCount} Rules
                        </span>
                    )}
                </div>

                {b.rentRange && (
                    <p className={`text-slate-300 ${compact ? "text-xs" : "text-sm"}`}>
                        <span className="font-semibold text-white">
                            ₹{b.rentRange.min.toLocaleString('en-IN')}
                            {b.rentRange.min !== b.rentRange.max && ` – ₹${b.rentRange.max.toLocaleString('en-IN')}`}
                        </span>
                        <span className="text-slate-500 text-xs">/month</span>
                    </p>
                )}
            </div>
        </Link>
    )
}
