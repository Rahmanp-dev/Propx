'use client'

import { useState, useTransition } from "react"
import {
    createClause, updateClause, deleteClause,
    addTemplateClausesToBuilding,
} from "@/lib/actions/clauses"
import { CLAUSE_TEMPLATES } from "@/lib/clause-templates"
import {
    Shield, ShieldAlert, ShieldCheck, AlertTriangle,
    Plus, Trash2, Edit3, Power, PowerOff, CheckCircle2,
    Loader2, ListPlus, Eye, X, ChevronDown
} from "lucide-react"
import Link from "next/link"

type ClauseData = {
    id: string
    buildingId: string
    category: string
    title: string
    description: string
    severity: string
    isActive: boolean
    sortOrder: number
    createdAt: string | Date
    updatedAt: string | Date
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CRITICAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Critical' },
    HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'High' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Medium' },
    LOW: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Low' },
}

const CATEGORY_LABELS: Record<string, string> = {
    OCCUPANCY: "Occupancy", ELECTRICITY: "Electricity", LOCK_IN: "Lock-in Period",
    STRUCTURAL: "Structural", PETS: "Pets", NOISE: "Noise & Hours",
    GUESTS: "Guests & Visitors", PARKING: "Parking", WASTE: "Waste & Hygiene",
    POLICE_VERIFICATION: "Police Verification", CUSTOM: "Custom",
}

export function ClausesManager({ buildingId, initialClauses, userId }: {
    buildingId: string
    initialClauses: ClauseData[]
    userId: string
}) {
    const [clauses, setClauses] = useState<ClauseData[]>(initialClauses)
    const [isPending, startTransition] = useTransition()
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Form state
    const [form, setForm] = useState({
        category: 'CUSTOM',
        title: '',
        description: '',
        severity: 'MEDIUM',
    })

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const handleAddTemplates = () => {
        startTransition(async () => {
            const result = await addTemplateClausesToBuilding(buildingId)
            if (result.error) {
                showMsg('error', result.error)
            } else {
                showMsg('success', `Added ${result.data?.count} standard clauses`)
                // Refresh page
                window.location.reload()
            }
        })
    }

    const handleCreate = () => {
        if (!form.title.trim() || !form.description.trim()) {
            showMsg('error', 'Title and description are required')
            return
        }

        startTransition(async () => {
            const result = await createClause({
                buildingId,
                category: form.category as any,
                title: form.title,
                description: form.description,
                severity: form.severity as any,
                isActive: true,
                sortOrder: clauses.length,
            })
            if (result.error) {
                showMsg('error', result.error)
            } else {
                showMsg('success', 'Clause added successfully')
                setShowAddForm(false)
                setForm({ category: 'CUSTOM', title: '', description: '', severity: 'MEDIUM' })
                window.location.reload()
            }
        })
    }

    const handleToggle = (clauseId: string, currentActive: boolean) => {
        startTransition(async () => {
            const result = await updateClause({ clauseId, isActive: !currentActive })
            if (result.error) {
                showMsg('error', result.error)
            } else {
                setClauses(prev => prev.map(c =>
                    c.id === clauseId ? { ...c, isActive: !currentActive } : c
                ))
            }
        })
    }

    const handleDelete = (clauseId: string) => {
        if (!confirm('Delete this clause? This action cannot be undone.')) return

        startTransition(async () => {
            const result = await deleteClause(clauseId)
            if (result.error) {
                showMsg('error', result.error)
            } else {
                setClauses(prev => prev.filter(c => c.id !== clauseId))
                showMsg('success', 'Clause deleted')
            }
        })
    }

    const handleUseTemplate = (template: typeof CLAUSE_TEMPLATES[number]) => {
        setForm({
            category: template.category,
            title: template.title,
            description: template.description,
            severity: template.severity,
        })
        setShowAddForm(true)
    }

    const activeClauses = clauses.filter(c => c.isActive)
    const inactiveClauses = clauses.filter(c => !c.isActive)

    return (
        <div className="space-y-6">
            {/* Status Message */}
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    {message.text}
                </div>
            )}

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
                {clauses.length === 0 && (
                    <button
                        onClick={handleAddTemplates}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
                        Add Standard Templates
                    </button>
                )}
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                >
                    {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showAddForm ? 'Cancel' : 'Add Custom Clause'}
                </button>
                <Link
                    href={`/discover/${buildingId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
                >
                    <Eye className="h-4 w-4" />
                    Preview on Discover
                </Link>
                <div className="ml-auto text-sm text-muted-foreground">
                    {activeClauses.length} active · {inactiveClauses.length} inactive
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">
                        {editingId ? 'Edit Clause' : 'Add New Clause'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
                            <select
                                value={form.category}
                                onChange={e => setForm(s => ({ ...s, category: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Severity</label>
                            <select
                                value={form.severity}
                                onChange={e => setForm(s => ({ ...s, severity: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="CRITICAL">🔴 Critical</option>
                                <option value="HIGH">🟡 High</option>
                                <option value="MEDIUM">🔵 Medium</option>
                                <option value="LOW">⚪ Low</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
                            placeholder="e.g., No Pets Policy"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                            rows={3}
                            placeholder="Detailed clause text..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                        />
                    </div>

                    {/* Quick template selection */}
                    {clauses.length === 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">Or pick from templates:</label>
                            <div className="flex flex-wrap gap-1.5">
                                {CLAUSE_TEMPLATES.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleUseTemplate(t)}
                                        className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
                                    >
                                        {t.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleCreate}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add Clause
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setForm({ category: 'CUSTOM', title: '', description: '', severity: 'MEDIUM' }) }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Clauses List */}
            {clauses.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-400">No clauses defined yet</h3>
                    <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                        Add standard templates to quickly set up common building rules, or create custom clauses.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {clauses.map((clause) => {
                        const style = SEVERITY_STYLES[clause.severity] || SEVERITY_STYLES.LOW

                        return (
                            <div
                                key={clause.id}
                                className={`p-4 rounded-xl border transition-all ${
                                    clause.isActive
                                        ? `${style.bg} ${style.border}`
                                        : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-bold text-gray-900">{clause.title}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text} border ${style.border}`}>
                                                {style.label}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                {CATEGORY_LABELS[clause.category] || clause.category}
                                            </span>
                                            {!clause.isActive && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                                                    DISABLED
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{clause.description}</p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggle(clause.id, clause.isActive)}
                                            disabled={isPending}
                                            className={`p-2 rounded-lg transition-colors ${
                                                clause.isActive
                                                    ? 'hover:bg-amber-100 text-amber-600'
                                                    : 'hover:bg-emerald-100 text-emerald-600'
                                            }`}
                                            title={clause.isActive ? 'Disable clause' : 'Enable clause'}
                                        >
                                            {clause.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(clause.id)}
                                            disabled={isPending}
                                            className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                                            title="Delete clause"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
