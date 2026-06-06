import { getBuildings } from "@/lib/actions/building"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { auth } from "@/lib/auth"
import { BuildingCard } from "@/components/dashboard/building-card"
import { AddBuildingDialog } from "@/components/dashboard/add-building-dialog"
import { AlertTriangle, TrendingUp, Wallet, Clock, Users, Building2, BarChart3, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PendingPaymentsTable } from "@/components/dashboard/pending-payments-table"
import { GenerateDuesButton } from "@/components/dashboard/generate-dues-button"
import { CopyPortalLink } from "@/components/dashboard/copy-portal-link"
import { MonthFilter } from "@/components/dashboard/month-filter"
import { BuildingMapView } from "@/components/dashboard/building-map-view"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
    searchParams: Promise<{
        month?: string
        view?: string
    }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const session = await auth()
    const userId = session?.user?.id || 'user'
    
    const params = await searchParams
    const monthFilter = params.month || 'all'
    const view = params.view || 'list'

    const [bRes, sRes] = await Promise.all([
        getBuildings(monthFilter),
        getDashboardStats(monthFilter)
    ])

    const buildings = bRes.data
    const stats = sRes.data

    if (!buildings || !stats) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-2xl font-bold text-red-500">Error loading dashboard</div>
                <p className="text-muted-foreground">Could not connect to the database. Please check your connection and refresh.</p>
                <pre className="text-xs text-left bg-slate-100 p-4 rounded-lg max-w-2xl mx-auto overflow-auto">
                    {JSON.stringify({ buildingError: (bRes as any).error, statsError: (sRes as any).error }, null, 2)}
                </pre>
            </div>
        )
    }

    const { revenue, alerts, counts } = stats

    const collectionRate = revenue.expected > 0 ? Math.round((revenue.collected / revenue.expected) * 100) : 0

    return (
        <div className="space-y-4 md:space-y-8">
            {/* Page Header */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your property portfolio</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <MonthFilter />
                    <CopyPortalLink />
                    <GenerateDuesButton />
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.expected.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">Current Month</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collected</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.collected.toLocaleString('en-IN')}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(collectionRate, 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-blue-600">{collectionRate}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <BarChart3 className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹{revenue.outstanding.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">Pending collection</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.tenants}</div>
                        <p className="text-xs text-muted-foreground">Across {counts.buildings} buildings</p>
                    </CardContent>
                </Card>

                {/* Smart Alerts Section */}
                <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-900">
                            <AlertTriangle className="h-4 w-4" /> Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {alerts.overdue.length > 0 ? (
                                <div className="text-sm text-red-600 font-medium">
                                    {alerts.overdue.length} Payments Overdue
                                </div>
                            ) : (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                    ✓ No overdue payments
                                </div>
                            )}

                            {alerts.expiring.length > 0 && (
                                <div className="text-sm text-amber-700 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {alerts.expiring.length} Leases Expiring
                                </div>
                            )}

                            {alerts.overdue.length === 0 && alerts.expiring.length === 0 && (
                                <div className="text-sm text-muted-foreground">All clear ✓</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Payments Section */}
            {alerts.overdue.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Pending Dues</h2>
                    <div className="overflow-x-auto pb-2">
                        <PendingPaymentsTable payments={alerts.overdue} userId={userId} />
                    </div>
                </div>
            )}

            {/* Properties Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Tab Switcher */}
                        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500">
                            <Link
                                href={`/${userId}/dashboard?view=list${monthFilter !== 'all' ? `&month=${monthFilter}` : ''}`}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'hover:bg-slate-50/50 hover:text-slate-900'}`}
                            >
                                List View
                            </Link>
                            <Link
                                href={`/${userId}/dashboard?view=map${monthFilter !== 'all' ? `&month=${monthFilter}` : ''}`}
                                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${view === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'hover:bg-slate-50/50 hover:text-slate-900'}`}
                            >
                                Map View
                            </Link>
                        </div>
                        <AddBuildingDialog />
                    </div>
                </div>

                {view === 'map' ? (
                    <BuildingMapView buildings={buildings} userId={userId} />
                ) : (
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {buildings.map((building) => {
                            const occupiedFlats = building.flats.filter((f: any) => f.status === 'OCCUPIED').length
                            
                            let totalRevenue = 0
                            let collectedRevenue = 0
                            
                            for (const f of building.flats) {
                                const monthPayment = f.payments?.[0]
                                if (monthPayment) {
                                    totalRevenue += monthPayment.totalDue || 0
                                    collectedRevenue += monthPayment.amountPaid || 0
                                } else if (f.status === 'OCCUPIED') {
                                    // Fallback if no payment generated yet but occupied
                                    totalRevenue += (f.rentAmount || 0) + (f.maintenanceAmount || 0)
                                }
                            }

                            return (
                                <BuildingCard
                                    key={building.id}
                                    userId={userId}
                                    building={{
                                        id: building.id,
                                        name: building.name,
                                        address: building.address,
                                        totalFlats: building.totalFlats,
                                        occupiedFlats,
                                        totalRevenue,
                                        collectedRevenue,
                                    }}
                                />
                            )
                        })}
                        {buildings.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                                No properties found. Add your first building to get started.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
