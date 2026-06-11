'use client'

import { useState } from 'react'

const PRICING = {
    STARTER: { MONTHLY: 499, QUARTERLY: 1349, HALF_YEARLY: 2549, YEARLY: 4999 },
    BUILDER: { MONTHLY: 1199, QUARTERLY: 3249, HALF_YEARLY: 6149, YEARLY: 11999 },
    PORTFOLIO: { MONTHLY: 2499, QUARTERLY: 6749, HALF_YEARLY: 12749, YEARLY: 24999 }
}

const BOUNTIES = {
    STARTER: { MONTHLY: 200, QUARTERLY: 400, HALF_YEARLY: 800, YEARLY: 1500 },
    BUILDER: { MONTHLY: 400, QUARTERLY: 1000, HALF_YEARLY: 2000, YEARLY: 3500 },
    PORTFOLIO: { MONTHLY: 800, QUARTERLY: 2000, HALF_YEARLY: 4000, YEARLY: 7000 }
}

const TIERS = [
    { id: 'STARTER', icon: '⚡', color: 'from-blue-400 to-blue-600' },
    { id: 'BUILDER', icon: '🚀', color: 'from-violet-400 to-fuchsia-500' },
    { id: 'PORTFOLIO', icon: '👑', color: 'from-amber-400 to-orange-500' }
]

const DURATIONS = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY']
const DURATION_LABELS = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']

export default function ScoutCalculatorPage() {
    const [inputs, setInputs] = useState<Record<string, number>>({})

    const handleInput = (tier: string, duration: string, value: string) => {
        let val = parseInt(value)
        if (isNaN(val)) val = 0
        setInputs(prev => ({ ...prev, [`${tier}-${duration}`]: val }))
    }

    let paidConversions = 0
    let totalBounty = 0
    let totalRevenue = 0

    TIERS.forEach(tier => {
        DURATIONS.forEach(duration => {
            const count = inputs[`${tier.id}-${duration}`] || 0
            if (count > 0) {
                paidConversions += count
                // @ts-ignore
                totalBounty += count * BOUNTIES[tier.id][duration]
                // @ts-ignore
                totalRevenue += count * PRICING[tier.id][duration]
            }
        })
    })

    let bonus = 0
    let bonusLabel = "None"
    if (paidConversions >= 25) { bonus = 6000; bonusLabel = "25+ Paid"; }
    else if (paidConversions >= 15) { bonus = 3000; bonusLabel = "15+ Paid"; }
    else if (paidConversions >= 10) { bonus = 1500; bonusLabel = "10+ Paid"; }

    const scoutTotal = totalBounty + bonus
    const companyProfit = totalRevenue - scoutTotal

    return (
        <div className="p-4 space-y-8 pb-10">
            <div className="pt-2">
                <h2 className="text-xl font-bold text-white">Earnings Calculator</h2>
                <p className="text-sm text-indigo-200/60">Project your monthly take-home pay based on conversions.</p>
            </div>

            {/* Total Earnings Card */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6 text-center shadow-lg shadow-indigo-500/5">
                <p className="text-sm font-medium text-indigo-200/70 mb-2">Estimated Take-home</p>
                <p className="text-5xl font-black text-white tracking-tight">₹{scoutTotal.toLocaleString('en-IN')}</p>
                
                <div className="mt-6 flex justify-between text-sm">
                    <div className="text-left">
                        <p className="text-indigo-200/50">Base Comm.</p>
                        <p className="font-bold text-white">₹{totalBounty.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-200/50">Bonus ({bonusLabel})</p>
                        <p className="font-bold text-emerald-400">+₹{bonus.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <h3 className="font-semibold text-white">Conversion Projections</h3>
                {TIERS.map(tier => (
                    <div key={tier.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br ${tier.color} text-xs`}>{tier.icon}</span>
                            {tier.id}
                        </h4>
                        <div className="space-y-3">
                            {DURATIONS.map((duration, i) => (
                                <div key={duration} className="flex items-center justify-between">
                                    <label className="text-sm text-indigo-200/70">{DURATION_LABELS[i]}</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        inputMode="numeric"
                                        value={inputs[`${tier.id}-${duration}`] || ''}
                                        onChange={(e) => handleInput(tier.id, duration, e.target.value)}
                                        className="w-16 rounded-lg border border-white/10 bg-slate-950/50 px-2 py-1 text-center font-bold text-white outline-none focus:border-indigo-500"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Company Metrics */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/40 mb-4 text-center">Company Margins</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-xs text-indigo-200/50 mb-1">Gross Rev</p>
                        <p className="font-bold text-white">₹{totalRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-emerald-400/50 mb-1">Net Profit</p>
                        <p className="font-bold text-emerald-400">₹{companyProfit.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
