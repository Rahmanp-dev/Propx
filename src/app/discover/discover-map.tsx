'use client'

import { useEffect, useRef, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import Link from "next/link"
import "leaflet/dist/leaflet.css"

// Custom SVG icons for map pins
const createPinIcon = (color: string, size: number = 32) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.3}" viewBox="0 0 24 32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/>
        <circle cx="12" cy="11" r="5" fill="white" opacity="0.9"/>
        <circle cx="12" cy="11" r="2.5" fill="${color}"/>
    </svg>`
    return L.divIcon({
        html: svg,
        className: 'custom-pin',
        iconSize: [size, size * 1.3],
        iconAnchor: [size / 2, size * 1.3],
        popupAnchor: [0, -size * 1.1],
    })
}

const vacantIcon = createPinIcon("#10b981") // Emerald
const managedIcon = createPinIcon("#f97316") // Orange
const selectedIcon = createPinIcon("#6366f1", 40) // Indigo, larger

type MapBuilding = {
    id: string
    name: string
    address: string
    latitude: number | null
    longitude: number | null
    vacantCount: number
    totalFlats: number
    rentRange: { min: number; max: number } | null
}

// Hyderabad center
const HYDERABAD: [number, number] = [17.385044, 78.486671]

function MapUpdater({ selectedBuilding, buildings }: { selectedBuilding: string | null; buildings: MapBuilding[] }) {
    const map = useMap()

    useEffect(() => {
        if (selectedBuilding) {
            const b = buildings.find(b => b.id === selectedBuilding)
            if (b && typeof b.latitude === 'number' && typeof b.longitude === 'number' && isFinite(b.latitude) && isFinite(b.longitude)) {
                try {
                    map.flyTo([b.latitude, b.longitude], 16, { duration: 0.8 })
                } catch (e) {
                    console.error("Leaflet flyTo error:", e);
                }
            }
        }
    }, [selectedBuilding, buildings, map])

    return null
}

export default function DiscoverMap({
    buildings,
    selectedBuilding,
    onBuildingSelect,
}: {
    buildings: MapBuilding[]
    selectedBuilding: string | null
    onBuildingSelect: (id: string | null) => void
}) {
    const validBuildings = useMemo(() => buildings.filter(b => 
        typeof b.latitude === 'number' && isFinite(b.latitude) && 
        typeof b.longitude === 'number' && isFinite(b.longitude)
    ), [buildings])

    // Calculate bounds
    const bounds = useMemo(() => validBuildings.length > 0
        ? L.latLngBounds(validBuildings.map(b => [b.latitude!, b.longitude!] as [number, number]))
        : undefined, [validBuildings])

    return (
        <>
            {/* Custom CSS for map pins */}
            <style jsx global>{`
                .custom-pin {
                    background: none !important;
                    border: none !important;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    transition: transform 0.2s ease;
                }
                .custom-pin:hover {
                    transform: scale(1.15);
                    z-index: 1000 !important;
                }
                .leaflet-popup-content-wrapper {
                    background: #0f172a !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    color: white !important;
                    font-family: 'Inter', system-ui, sans-serif !important;
                }
                .leaflet-popup-tip {
                    background: #0f172a !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .leaflet-popup-close-button {
                    color: #64748b !important;
                    font-size: 20px !important;
                    top: 8px !important;
                    right: 10px !important;
                }
                .leaflet-popup-close-button:hover {
                    color: white !important;
                }
                .leaflet-container {
                    background: #0f172a !important;
                }
                .leaflet-control-zoom {
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important;
                    overflow: hidden;
                }
                .leaflet-control-zoom a {
                    background: #1e293b !important;
                    color: #94a3b8 !important;
                    border-color: rgba(255,255,255,0.06) !important;
                }
                .leaflet-control-zoom a:hover {
                    background: #334155 !important;
                    color: white !important;
                }
                .leaflet-control-attribution {
                    background: rgba(15, 23, 42, 0.8) !important;
                    color: #475569 !important;
                    font-size: 9px !important;
                }
                .leaflet-control-attribution a {
                    color: #6366f1 !important;
                }
            `}</style>

            <MapContainer
                center={HYDERABAD}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
                {...(bounds && validBuildings.length >= 2 ? { bounds, boundsOptions: { padding: [50, 50] } } : {})}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapUpdater selectedBuilding={selectedBuilding} buildings={validBuildings} />

                {validBuildings.map(building => (
                    <Marker
                        key={building.id}
                        position={[building.latitude!, building.longitude!]}
                        icon={
                            selectedBuilding === building.id
                                ? selectedIcon
                                : building.vacantCount > 0
                                    ? vacantIcon
                                    : managedIcon
                        }
                        eventHandlers={{
                            mouseover: () => onBuildingSelect(building.id),
                            mouseout: () => onBuildingSelect(null),
                        }}
                    >
                        <Popup>
                            <div className="p-4 min-w-[220px]">
                                <h3 className="text-sm font-bold text-white mb-1">{building.name}</h3>
                                <p className="text-xs text-slate-300 mb-3 leading-relaxed">{building.address}</p>

                                <div className="flex items-center gap-3 mb-3">
                                    {building.vacantCount > 0 ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                            {building.vacantCount} Vacant
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                                            Fully Occupied
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">{building.totalFlats} total</span>
                                </div>

                                {building.rentRange && (
                                    <p className="text-xs text-slate-300 mb-3">
                                        <span className="font-semibold text-white">
                                            ₹{building.rentRange.min.toLocaleString('en-IN')}
                                            {building.rentRange.min !== building.rentRange.max && ` – ₹${building.rentRange.max.toLocaleString('en-IN')}`}
                                        </span>
                                        <span className="text-slate-400">/month</span>
                                    </p>
                                )}

                                <Link
                                    href={`/discover/${building.id}`}
                                    className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                                >
                                    View Details →
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-6 left-4 lg:left-auto lg:right-4 z-[400] bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Vacant</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Managed</span>
                </div>
            </div>
        </>
    )
}
