'use client'

import { useState, useEffect } from 'react'
import { getElectricityDashboard, bulkRecordMeterReadings } from '@/lib/actions/electricity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'

export default function ElectricityPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [flats, setFlats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [readings, setReadings] = useState<Record<string, string>>({})
    const [initialFlags, setInitialFlags] = useState<Record<string, boolean>>({})

    useEffect(() => {
        loadDashboard()
    }, [month, year])

    const loadDashboard = async () => {
        setLoading(true)
        const res = await getElectricityDashboard(month, year)
        if (res.success && res.data) {
            setFlats(res.data)
            const initialReadings: Record<string, string> = {}
            res.data.forEach(flat => {
                if (flat.readingValue !== null) {
                    initialReadings[flat.flatId] = flat.readingValue.toString()
                }
            })
            setReadings(initialReadings)
            // Auto-detect: if flat has no previous reading and no current reading, mark as initial candidate
            const flags: Record<string, boolean> = {}
            res.data.forEach((flat: any) => {
                flags[flat.flatId] = false // default: not initial
            })
            setInitialFlags(flags)
        } else {
            toast("Error", { description: res.error || "Failed to record readings" })
        }
        setLoading(false)
    }

    const handleReadingChange = (flatId: string, value: string) => {
        setReadings(prev => ({ ...prev, [flatId]: value }))
    }

    const handleSaveAll = async () => {
        setSaving(true)
        const dataToSave = flats
            .filter(f => readings[f.flatId] !== undefined && readings[f.flatId] !== '')
            .map(f => ({
                flatId: f.flatId,
                reading: parseFloat(readings[f.flatId]),
                month,
                year,
                isInitial: initialFlags[f.flatId] || false
            }))
            .filter(r => !isNaN(r.reading))

        if (dataToSave.length === 0) {
            toast("No valid readings to save")
            setSaving(false)
            return
        }

        const res = await bulkRecordMeterReadings(dataToSave)
        if (res.success) {
            toast("Success", { description: "Meter readings recorded successfully." })
            loadDashboard()
        } else {
            toast("Error", { description: res.error || "Error saving readings" })
        }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Electricity Readings</h1>
                    <Badge variant="outline" className="text-lg px-4 py-1">
                        <Zap className="mr-2 h-4 w-4" /> {month}/{year}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {[year - 1, year, year + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <Button onClick={handleSaveAll} disabled={saving || loading}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save All'}
                    </Button>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-sm text-blue-300 flex items-start gap-3">
                <Zap className="h-4 w-4 mt-0.5 shrink-0" />
                <p><strong>Tip:</strong> Mark readings as &quot;Initial&quot; when onboarding a building. Initial readings serve as baseline values and won&apos;t generate electricity bills. Only the difference between the initial reading and the next month&apos;s entry will be billed.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Metered Flats</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : flats.length > 0 ? (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Building</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Flat</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tenant</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Pending Dues</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Reading</th>
                                        <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Initial</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {flats.map((flat) => (
                                        <tr key={flat.flatId} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">{flat.buildingName}</td>
                                            <td className="p-4 align-middle font-medium">{flat.flatNumber}</td>
                                            <td className="p-4 align-middle text-muted-foreground">{flat.tenantName || 'Vacant'}</td>
                                            <td className="p-4 align-middle">
                                                {flat.hasReading ? (
                                                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Recorded</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <span className={`font-semibold ${flat.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ₹{flat.pendingAmount?.toLocaleString() || '0'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Input 
                                                    type="number" 
                                                    placeholder="0.0" 
                                                    className="w-24 ml-auto text-right"
                                                    value={readings[flat.flatId] || ''}
                                                    onChange={(e) => handleReadingChange(flat.flatId, e.target.value)}
                                                />
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <label className="inline-flex items-center gap-2 cursor-pointer" title="Mark as initial/baseline reading (won't generate a bill)">
                                                    <input
                                                        type="checkbox"
                                                        checked={initialFlags[flat.flatId] || false}
                                                        onChange={(e) => {
                                                            setInitialFlags(prev => ({ ...prev, [flat.flatId]: e.target.checked }))
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No metered flats found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
