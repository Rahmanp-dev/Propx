"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

// Leaflet map must be dynamically imported with SSR disabled
const DiscoverMap = dynamic(() => import("./discover-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
            Loading map...
        </div>
    )
})

export function DiscoverClient({ buildings }: { buildings: any[] }) {
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
    const [filterVacant, setFilterVacant] = useState(false)

    const filteredBuildings = filterVacant 
        ? buildings.filter(b => b.vacantCount > 0)
        : buildings

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-61px)]">
            {/* Sidebar List */}
            <div className="w-full lg:w-[400px] border-r border-white/5 bg-slate-950 flex flex-col h-full z-10">
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {filteredBuildings.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No properties found.</p>
                    ) : (
                        filteredBuildings.map(b => (
                            <div 
                                key={b.id}
                                onMouseEnter={() => setSelectedBuilding(b.id)}
                                onMouseLeave={() => setSelectedBuilding(null)}
                                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                                    selectedBuilding === b.id 
                                        ? 'border-indigo-500/50 bg-indigo-500/10' 
                                        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                                }`}
                            >
                                <h3 className="font-bold text-white text-base">{b.name}</h3>
                                <p className="text-xs text-slate-400 mt-1 mb-3">{b.address}</p>
                                
                                <div className="flex items-center gap-2 mb-3">
                                    {b.vacantCount > 0 ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                            {b.vacantCount} Vacant
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                                            Fully Occupied
                                        </span>
                                    )}
                                </div>

                                {b.rentRange && (
                                    <p className="text-sm text-slate-300">
                                        <span className="font-semibold text-white">
                                            ₹{b.rentRange.min.toLocaleString('en-IN')}
                                            {b.rentRange.min !== b.rentRange.max && ` – ₹${b.rentRange.max.toLocaleString('en-IN')}`}
                                        </span>
                                        <span className="text-slate-500 text-xs">/month</span>
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 h-[50vh] lg:h-full relative bg-slate-900 z-0">
                <DiscoverMap 
                    buildings={filteredBuildings} 
                    selectedBuilding={selectedBuilding}
                    onBuildingSelect={setSelectedBuilding}
                />
            </div>
        </div>
    )
}
