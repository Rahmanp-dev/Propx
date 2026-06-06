"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AddBuildingDialog } from "./add-building-dialog"
import { MapPin, Navigation, Info, Check, X, Loader2 } from "lucide-react"

interface BuildingMapViewProps {
    buildings: any[]
    userId: string
}

export function BuildingMapView({ buildings, userId }: BuildingMapViewProps) {
    const mapRef = useRef<any>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const [isAddMode, setIsAddMode] = useState(false)
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [tempMarker, setTempMarker] = useState<any>(null)
    const [reverseAddress, setReverseAddress] = useState("")
    const [isGeocoding, setIsGeocoding] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Load Leaflet dynamically on client side
    useEffect(() => {
        if (typeof window === "undefined") return

        // Check if Leaflet is already loaded
        if ((window as any).L) {
            setLeafletLoaded(true)
            return
        }

        // Add Leaflet CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)

        // Add Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""
        script.onload = () => {
            setLeafletLoaded(true)
        }
        document.body.appendChild(script)

        return () => {
            // Clean up scripts & styles if component unmounts
            if (document.head.contains(link)) document.head.removeChild(link)
            if (document.body.contains(script)) document.body.removeChild(script)
        }
    }, [])

    // Initialize Map and Markers
    useEffect(() => {
        if (!leafletLoaded || !mapContainerRef.current) return

        const L = (window as any).L
        if (!L) return

        // Fix Leaflet marker icon paths
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })

        // Hyderabad coordinates as default center
        const defaultCenter = [17.3850, 78.4867]

        // If there are existing buildings with coordinates, center on the first one
        const validBuildings = buildings.filter(b => b.latitude !== null && b.longitude !== null)
        const center = validBuildings.length > 0 
            ? [validBuildings[0].latitude, validBuildings[0].longitude] 
            : defaultCenter

        const map = L.map(mapContainerRef.current, {
            center,
            zoom: 12,
            zoomControl: false,
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        L.control.zoom({ position: "topright" }).addTo(map)

        mapRef.current = map

        // Render existing building markers
        validBuildings.forEach(building => {
            const popupContent = `
                <div class="p-2 space-y-1.5 min-w-[200px]">
                    <h4 class="font-bold text-sm text-slate-900">${building.name}</h4>
                    <p class="text-xs text-slate-500">${building.address}</p>
                    <div class="text-xs text-slate-600 font-semibold">
                        Flats: ${building.totalFlats} | Occupied: ${building.flats?.filter((f: any) => f.status === 'OCCUPIED').length || 0}
                    </div>
                    <a href="/${userId}/buildings/${building.id}" class="inline-block mt-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors text-center w-full decoration-none">
                        View Details
                    </a>
                </div>
            `
            L.marker([building.latitude, building.longitude])
                .addTo(map)
                .bindPopup(popupContent)
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [leafletLoaded, buildings, userId])

    // Handle map clicks in Add Mode
    useEffect(() => {
        const map = mapRef.current
        if (!map || !leafletLoaded) return

        const L = (window as any).L
        if (!L) return

        const handleMapClick = (e: any) => {
            if (!isAddMode) return

            const { lat, lng } = e.latlng
            setSelectedCoords({ lat, lng })

            // Remove previous temp marker if exists
            if (tempMarker) {
                tempMarker.remove()
            }

            // Add new temp marker with red/highlight style
            const addIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })

            const marker = L.marker([lat, lng], { icon: addIcon }).addTo(map)
            setTempMarker(marker)

            // Pan to the selected coordinates
            map.panTo([lat, lng])
        }

        map.on("click", handleMapClick)

        return () => {
            map.off("click", handleMapClick)
        }
    }, [leafletLoaded, isAddMode, tempMarker])

    // Reverse geocode when coordinates are selected
    useEffect(() => {
        if (!selectedCoords) return

        const getAddress = async () => {
            setIsGeocoding(true)
            setReverseAddress("Fetching address...")
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCoords.lat}&lon=${selectedCoords.lng}`
                )
                const data = await response.json()
                if (data && data.display_name) {
                    setReverseAddress(data.display_name)
                } else {
                    setReverseAddress(`Coordinate Location: ${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`)
                }
            } catch (err) {
                console.error("Reverse geocoding failed:", err)
                setReverseAddress(`Coordinate Location: ${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`)
            } finally {
                setIsGeocoding(false)
            }
        }

        getAddress()
    }, [selectedCoords])

    const handleCancelAdd = () => {
        if (tempMarker) {
            tempMarker.remove()
            setTempMarker(null)
        }
        setSelectedCoords(null)
        setReverseAddress("")
        // Return to freeform navigation mode (remains in add mode if they want to click elsewhere, or they can turn it off)
    }

    const handleConfirmAdd = () => {
        setDialogOpen(true)
    }

    const handleCloseDialog = (isOpen: boolean) => {
        setDialogOpen(isOpen)
        if (!isOpen) {
            // If they closed the dialog, clear map states
            handleCancelAdd()
            setIsAddMode(false)
        }
    }

    if (!leafletLoaded) {
        return (
            <Card className="w-full h-[500px] flex items-center justify-center border-slate-200">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-sm font-medium">Loading Map module...</span>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Map View Navigation</h3>
                        <p className="text-xs text-muted-foreground">
                            {isAddMode 
                                ? "Click anywhere on the map to mark the building's location." 
                                : "View building markers and click on them for information."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        variant={isAddMode ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                            if (isAddMode) {
                                handleCancelAdd()
                            }
                            setIsAddMode(!isAddMode)
                        }}
                        className="font-medium text-xs shadow-sm"
                    >
                        {isAddMode ? (
                            <>
                                <X className="mr-1.5 h-3.5 w-3.5" /> Exit Add Mode
                            </>
                        ) : (
                            <>
                                <MapPin className="mr-1.5 h-3.5 w-3.5" /> Add via Map Click
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
                {/* Map Container */}
                <div ref={mapContainerRef} className="w-full h-[500px] z-10" />

                {/* Add Mode Floating Overlay Card */}
                {isAddMode && (
                    <div className="absolute top-4 left-4 z-[400] max-w-[90%] sm:max-w-sm bg-white/95 backdrop-blur-sm border shadow-lg rounded-xl p-3.5 transition-all">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Info className="h-4.5 w-4.5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">Add Building Mode</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Click a spot on the map to pin your new building.
                                    </p>
                                </div>
                            </div>

                            {selectedCoords ? (
                                <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                                    <div className="font-semibold text-slate-700">Pinned Location:</div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                        Lat: {selectedCoords.lat.toFixed(6)}, Lng: {selectedCoords.lng.toFixed(6)}
                                    </div>
                                    <div className="mt-1 font-medium text-slate-800 line-clamp-2">
                                        {isGeocoding ? (
                                            <span className="flex items-center gap-1.5">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Fetching address...
                                            </span>
                                        ) : (
                                            reverseAddress
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            onClick={handleConfirmAdd}
                                            disabled={isGeocoding}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-[11px] h-8 font-semibold"
                                        >
                                            <Check className="mr-1 h-3.5 w-3.5" /> Confirm/Add
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelAdd}
                                            className="flex-1 text-[11px] h-8 font-semibold border-slate-200"
                                        >
                                            <X className="mr-1 h-3.5 w-3.5" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs bg-blue-50 border border-blue-100 text-blue-800 p-2 rounded-lg font-medium text-center">
                                    Click on the map to select a point.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Controlled Add Building Dialog triggered from map confirmations */}
            <AddBuildingDialog
                defaultLat={selectedCoords?.lat}
                defaultLng={selectedCoords?.lng}
                defaultAddress={reverseAddress}
                open={dialogOpen}
                onOpenChange={handleCloseDialog}
                trigger={null} // Controlled only
            />
        </div>
    )
}
