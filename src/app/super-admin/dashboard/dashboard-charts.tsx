"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ['#6b7280', '#3b82f6', '#8b5cf6']

export function DashboardCharts({
    planDistribution,
}: {
    planDistribution: { STARTER: number; BUILDER: number; PORTFOLIO: number }
}) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const pieData = [
        { name: 'Starter', value: planDistribution.STARTER, color: '#6b7280' },
        { name: 'Builder', value: planDistribution.BUILDER, color: '#3b82f6' },
        { name: 'Portfolio', value: planDistribution.PORTFOLIO, color: '#8b5cf6' },
    ].filter(d => d.value > 0)

    const barData = [
        { name: 'Starter', count: planDistribution.STARTER },
        { name: 'Builder', count: planDistribution.BUILDER },
        { name: 'Portfolio', count: planDistribution.PORTFOLIO },
    ]

    const total = planDistribution.STARTER + planDistribution.BUILDER + planDistribution.PORTFOLIO

    if (!isMounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Loading charts...
                </CardContent>
            </Card>
        )
    }

    if (total === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No organizations yet
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8">
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                        <div className="text-2xl font-bold text-gray-600">{planDistribution.STARTER}</div>
                        <div className="text-xs text-muted-foreground">Starter</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">{planDistribution.BUILDER}</div>
                        <div className="text-xs text-muted-foreground">Builder</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50">
                        <div className="text-2xl font-bold text-purple-600">{planDistribution.PORTFOLIO}</div>
                        <div className="text-xs text-muted-foreground">Portfolio</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
