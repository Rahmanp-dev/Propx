'use client'

import { useState, useEffect } from "react"
import { submitDiscoverInquiry, logQRScan } from "@/lib/actions/discover"
import {
    MapPin, Home, Shield, ShieldAlert, ShieldCheck, Zap, Phone,
    Building2, CheckCircle2, Calendar, MessageSquare, ArrowRight,
    AlertTriangle, Loader2, ChevronDown, ChevronUp, Star, Image as ImageIcon
} from "lucide-react"

type BuildingData = {
    id: string
    name: string
    address: string
    city: string
    latitude: number | null
    longitude: number | null
    discoverBio: string | null
    amenities: string[]
    photos: string[]
    ratePerUnit: number
    totalFlats: number
    vacantCount: number
    flatTypes: string[]
    rentRange: { min: number; max: number } | null
    vacantByType: Record<string, { count: number; rentRange: { min: number; max: number } }>
    clauses: Array<{
        id: string
        category: string
        title: string
        description: string
        severity: string
    }>
    contactWhatsApp: string | null
    vacantFlats: Array<{
        id: string
        flatNumber: string
        flatType: string
        rentAmount: number
        maintenanceAmount: number
        depositAmount: number
        photos: string[]
    }>
}

const FLAT_TYPE_LABELS: Record<string, string> = {
    STUDIO: "Studio",
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    OTHER: "Other",
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: typeof Shield }> = {
    CRITICAL: { bg: 'bg-rose-500/8', text: 'text-rose-400', border: 'border-rose-500/20', icon: ShieldAlert },
    HIGH: { bg: 'bg-amber-500/8', text: 'text-amber-400', border: 'border-amber-500/20', icon: AlertTriangle },
    MEDIUM: { bg: 'bg-blue-500/8', text: 'text-blue-400', border: 'border-blue-500/20', icon: Shield },
    LOW: { bg: 'bg-slate-500/8', text: 'text-slate-400', border: 'border-slate-500/20', icon: ShieldCheck },
}

const AMENITY_ICONS: Record<string, string> = {
    "Parking": "🅿️", "CCTV": "📹", "Generator": "⚡", "Water Tank": "💧",
    "Lift": "🛗", "Security": "🔒", "Garden": "🌳", "Gym": "🏋️",
    "WiFi": "📶", "Power Backup": "🔋", "Fire Safety": "🧯", "Intercom": "📞",
}

export function BuildingDetailClient({ building, utmSource }: { building: BuildingData; utmSource: string | null }) {
    const [showClausesAll, setShowClausesAll] = useState(false)
    const [formState, setFormState] = useState({ name: '', phone: '', email: '', preferredBHK: '', message: '' })
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [clausesAccepted, setClausesAccepted] = useState(false)

    // Log QR scan if utm_source is banner/qr
    useEffect(() => {
        if (utmSource === 'banner' || utmSource === 'qr') {
            logQRScan(building.id, navigator.userAgent, document.referrer)
        }
    }, [building.id, utmSource])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitStatus('loading')
        setErrorMsg('')

        const result = await submitDiscoverInquiry({
            buildingId: building.id,
            name: formState.name,
            phone: formState.phone,
            email: formState.email || undefined,
            preferredBHK: formState.preferredBHK || undefined,
            message: formState.message || undefined,
            source: utmSource === 'banner' || utmSource === 'qr' ? 'QR_SCAN' : 'DISCOVER',
            utmSource: utmSource || undefined,
            clausesAccepted,
        })

        if (result.error) {
            setSubmitStatus('error')
            setErrorMsg(result.error)
        } else {
            setSubmitStatus('success')
        }
    }

    const criticalClauses = building.clauses.filter(c => c.severity === 'CRITICAL')
    const otherClauses = building.clauses.filter(c => c.severity !== 'CRITICAL')
    const displayClauses = showClausesAll ? building.clauses : criticalClauses

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Hero Section */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Building2 className="h-3 w-3" />
                        PropX Managed
                    </span>
                    {building.vacantCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            {building.vacantCount} Flat{building.vacantCount !== 1 ? 's' : ''} Available
                        </span>
                    )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                    {building.name}
                </h1>
                <p className="text-base text-slate-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    {building.address}, {building.city}
                </p>

                {building.discoverBio && (
                    <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {building.discoverBio}
                    </p>
                )}
            </div>

            {/* Building Photos Gallery */}
            {building.photos && building.photos.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-indigo-400" />
                        Building Photos
                    </h2>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                        {building.photos.map((url, i) => (
                            <div key={i} className="flex-none w-72 h-48 sm:w-96 sm:h-64 rounded-xl overflow-hidden border border-white/10 snap-center bg-slate-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Building photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Availability Section */}
                    <section>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Home className="h-5 w-5 text-emerald-400" />
                            Available Flats ({building.vacantCount})
                        </h2>
                        
                        <div className="grid gap-4">
                            {building.vacantFlats && building.vacantFlats.length > 0 ? (
                                building.vacantFlats.map((flat) => (
                                    <div key={flat.id} className="p-5 rounded-xl bg-slate-900 border border-white/5 overflow-hidden flex flex-col sm:flex-row gap-5">
                                        {/* Flat Photos Slider */}
                                        <div className="sm:w-48 h-32 rounded-lg bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-white/10 relative">
                                            {flat.photos && flat.photos.length > 0 ? (
                                                <div className="flex w-full h-full overflow-x-auto snap-x">
                                                    {flat.photos.map((url, i) => (
                                                        <img key={i} src={url} alt={`Flat ${flat.flatNumber}`} className="w-full h-full object-cover flex-none snap-center" />
                                                    ))}
                                                    {flat.photos.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] text-white font-medium">
                                                            {flat.photos.length} photos
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-600 flex flex-col items-center">
                                                    <Home className="h-6 w-6 mb-1 opacity-50" />
                                                    <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Flat Details */}
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-black text-white">Flat {flat.flatNumber}</h3>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            {FLAT_TYPE_LABELS[flat.flatType] || flat.flatType}
                                                        </span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-emerald-400">
                                                        ₹{flat.rentAmount.toLocaleString('en-IN')}<span className="text-sm font-semibold text-slate-500">/mo</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Deposit</div>
                                                    <div className="text-sm text-slate-300 font-medium">₹{flat.depositAmount.toLocaleString('en-IN')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Maintenance</div>
                                                    <div className="text-sm text-slate-300 font-medium">₹{flat.maintenanceAmount.toLocaleString('en-IN')}/mo</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 rounded-xl bg-slate-900 border border-white/5 text-center">
                                    <p className="text-sm text-slate-500">No flats currently available</p>
                                    <p className="text-xs text-slate-600 mt-1">Submit an inquiry to be notified when flats open up</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Pricing Section */}
                    {building.rentRange && (
                        <section>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-400" />
                                Pricing
                            </h2>
                            <div className="p-5 rounded-xl bg-slate-900 border border-white/5">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    <div>
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rent</div>
                                        <div className="text-lg font-bold text-white mt-1">
                                            ₹{building.rentRange.min.toLocaleString('en-IN')}
                                            {building.rentRange.min !== building.rentRange.max && ` – ₹${building.rentRange.max.toLocaleString('en-IN')}`}
                                        </div>
                                        <div className="text-xs text-slate-600">per month</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Electricity</div>
                                        <div className="text-lg font-bold text-white mt-1">₹{building.ratePerUnit}</div>
                                        <div className="text-xs text-slate-600">per unit</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Flat Types</div>
                                        <div className="text-lg font-bold text-white mt-1">
                                            {building.flatTypes.map(t => FLAT_TYPE_LABELS[t] || t).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Amenities */}
                    {building.amenities.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-4">Amenities</h2>
                            <div className="flex flex-wrap gap-2">
                                {building.amenities.map((amenity, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-300 font-medium">
                                        <span>{AMENITY_ICONS[amenity] || '✓'}</span>
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Building Rules & Clauses */}
                    {building.clauses.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-rose-400" />
                                Building Rules & Clauses
                            </h2>
                            <div className="space-y-2">
                                {displayClauses.map(clause => {
                                    const style = SEVERITY_STYLES[clause.severity] || SEVERITY_STYLES.LOW
                                    const Icon = style.icon
                                    return (
                                        <div key={clause.id} className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
                                            <div className="flex items-start gap-3">
                                                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.text}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-white">{clause.title}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                                                            {clause.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{clause.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {otherClauses.length > 0 && !showClausesAll && (
                                <button
                                    onClick={() => setShowClausesAll(true)}
                                    className="mt-3 flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                                >
                                    Show all {building.clauses.length} rules <ChevronDown className="h-3 w-3" />
                                </button>
                            )}

                            {showClausesAll && otherClauses.length > 0 && (
                                <button
                                    onClick={() => setShowClausesAll(false)}
                                    className="mt-3 flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
                                >
                                    Show critical only <ChevronUp className="h-3 w-3" />
                                </button>
                            )}
                        </section>
                    )}

                    {/* Legal Disclaimer */}
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-500">Disclaimer:</strong> PropX is a property management platform. 
                        This listing is for informational purposes and does not constitute a legal rental agreement. 
                        Prospective tenants are advised to verify all details independently and execute a formal 
                        registered rental agreement in compliance with applicable state laws before moving in.
                    </div>
                </div>

                {/* Sidebar — Inquiry Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-[65px]">
                        <div className="p-6 rounded-2xl bg-slate-900 border border-white/8">
                            <h3 className="text-base font-bold mb-1">Interested in this building?</h3>
                            <p className="text-xs text-slate-500 mb-5">Submit your details and the owner will get back to you</p>

                            {submitStatus === 'success' ? (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">Inquiry Submitted!</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        The building owner will review your inquiry and contact you soon.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Your name *"
                                            required
                                            value={formState.name}
                                            onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="tel"
                                            placeholder="Phone number *"
                                            required
                                            pattern="[0-9]{10,}"
                                            value={formState.phone}
                                            onChange={e => setFormState(s => ({ ...s, phone: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Email (optional)"
                                            value={formState.email}
                                            onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            value={formState.preferredBHK}
                                            onChange={e => setFormState(s => ({ ...s, preferredBHK: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/8 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        >
                                            <option value="">Preferred flat type</option>
                                            {building.flatTypes.map(t => (
                                                <option key={t} value={t}>{FLAT_TYPE_LABELS[t] || t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <textarea
                                            placeholder="Message (optional)"
                                            rows={3}
                                            maxLength={500}
                                            value={formState.message}
                                            onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/8 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                                        />
                                    </div>

                                    {building.clauses.length > 0 && (
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={clausesAccepted}
                                                onChange={e => setClausesAccepted(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/20"
                                            />
                                            <span className="text-xs text-slate-400 leading-relaxed">
                                                I have read and acknowledge the building rules & clauses listed above
                                            </span>
                                        </label>
                                    )}

                                    {errorMsg && (
                                        <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitStatus === 'loading'}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                                    >
                                        {submitStatus === 'loading' ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                                        ) : (
                                            <>Submit Inquiry <ArrowRight className="h-4 w-4" /></>
                                        )}
                                    </button>

                                    <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                                        Your details will be shared only with the building owner. 
                                        We do not share your information with third parties.
                                    </p>
                                </form>
                            )}
                        </div>

                        {/* WhatsApp CTA */}
                        {building.contactWhatsApp && (
                            <a
                                href={`https://wa.me/91${building.contactWhatsApp}?text=${encodeURIComponent(`Hi, I found ${building.name} on PropX Discover. I'm interested in renting a flat. Could you please share more details?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Chat on WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
