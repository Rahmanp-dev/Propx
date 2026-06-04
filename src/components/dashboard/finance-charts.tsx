"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Wallet, AlertTriangle, Building2, Zap, IndianRupee, Percent } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FinanceData {
    totalRevenue: number
    totalOutstanding: number
    totalExpected: number
    collectionRate: number
    currentMonth: {
        expected: number
        collected: number
        outstanding: number
        collectionRate: number
    }
    statusBreakdown: { status: string; _count: number }[]
    chartData: { name: string; collected: number; expected: number }[]
    buildingBreakdown: {
        id: string
        name: string
        totalDue: number
        totalCollected: number
        paidCount: number
        pendingCount: number
        collectionRate: number
    }[]
    recentTransactions: {
        id: string
        amountPaid: number
        paymentDate: Date | string | null
        status: string
        tenant: { fullName: string }
        flat: { flatNumber: string; flatType: string; building: { name: string } }
    }[]
    breakdownTotals: {
        rent: number
        maintenance: number
        electricity: number
    }
}

const STATUS_COLORS: Record<string, string> = {
    PAID: "#22c55e",
    PARTIAL: "#f59e0b",
    PENDING: "#ef4444",
    OVERDUE: "#dc2626",
}

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    STUDIO: "Studio",
    OTHER: "Other",
}

export function FinanceCharts({ data }: { data: FinanceData }) {
    const pieData = data.statusBreakdown.map(s => ({
        name: s.status,
        value: s._count,
    }))

    return (
        <>
            {/* Top KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">₹{data.totalRevenue.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">All-time collections</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹{data.totalOutstanding.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Needs collection</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.currentMonth.collected.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(data.currentMonth.collectionRate, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium">{data.currentMonth.collectionRate}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">of ₹{data.currentMonth.expected.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                        <Percent className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700">{data.collectionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Overall efficiency</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Breakdown Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-blue-500" /> Rent Component
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">₹{data.breakdownTotals.rent.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-orange-500" /> Maintenance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">₹{data.breakdownTotals.maintenance.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" /> Electricity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">₹{data.breakdownTotals.electricity.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Bar Chart - Expected vs Collected */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data.chartData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}
                                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                                <Legend />
                                <Bar dataKey="expected" fill="#e2e8f0" name="Expected" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Pie Chart + Recent Transactions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">No payment data yet</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Building Breakdown */}
            {data.buildingBreakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" /> Building-wise Collection
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.buildingBreakdown.map((b) => (
                                <div key={b.id} className="flex items-center gap-4">
                                    <div className="w-36 font-medium truncate">{b.name}</div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(b.collectionRate, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-16 text-right text-sm font-bold">{b.collectionRate}%</div>
                                    <div className="w-32 text-right text-sm text-muted-foreground">
                                        ₹{b.totalCollected.toLocaleString('en-IN')} / ₹{b.totalDue.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex gap-1">
                                        <Badge variant="outline" className="text-green-600 text-xs">{b.paidCount} paid</Badge>
                                        {b.pendingCount > 0 && (
                                            <Badge variant="destructive" className="text-xs">{b.pendingCount} due</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.recentTransactions.length > 0 ? (
                            data.recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{tx.tenant.fullName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {FLAT_TYPE_LABELS[tx.flat.flatType] || tx.flat.flatType} • Flat {tx.flat.flatNumber} • {tx.flat.building.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={tx.status === "PAID" ? "default" : tx.status === "PARTIAL" ? "secondary" : "destructive"} className="text-xs">
                                            {tx.status}
                                        </Badge>
                                        <div className="font-bold text-green-600">+₹{tx.amountPaid.toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                No transactions recorded yet
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
