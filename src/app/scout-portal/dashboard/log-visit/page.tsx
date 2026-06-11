'use client'

import { logScoutVisit } from '@/lib/actions/scout'
import { Building2, User, Phone, AlignLeft, Send } from 'lucide-react'
import { useFormStatus } from 'react-dom'

export default function LogVisitPage() {
    return (
        <div className="p-4 space-y-6">
            <div className="pt-2">
                <h2 className="text-xl font-bold text-white">Log a Visit</h2>
                <p className="text-sm text-indigo-200/60">Record the building you just visited.</p>
            </div>

            <form action={logScoutVisit} className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div>
                    <label htmlFor="buildingName" className="block text-sm font-medium text-indigo-200/80 mb-1">
                        Building Name / Address
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Building2 className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            name="buildingName"
                            id="buildingName"
                            required
                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g. Skyline Apartments"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-indigo-200/80 mb-1">
                        Owner / Manager Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <User className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            name="ownerName"
                            id="ownerName"
                            required
                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="ownerPhone" className="block text-sm font-medium text-indigo-200/80 mb-1">
                        Contact Phone
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Phone className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                        </div>
                        <input
                            type="tel"
                            name="ownerPhone"
                            id="ownerPhone"
                            required
                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter 10-digit number"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-indigo-200/80 mb-1">
                        Notes (Optional)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-3">
                            <AlignLeft className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                        </div>
                        <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Any details about the visit..."
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <SubmitButton />
                </div>
            </form>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="group relative flex w-full justify-center items-center gap-2 rounded-lg border border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
        >
            {pending ? 'Logging Visit...' : 'Log Visit'}
            {!pending && <Send className="h-4 w-4" />}
        </button>
    )
}
