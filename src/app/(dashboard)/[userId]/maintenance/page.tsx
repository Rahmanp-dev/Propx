import { getMaintenanceRequests, getMaintenanceStats } from "@/lib/actions/maintenance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Clock, CheckCircle, Timer } from "lucide-react"
import { MaintenanceList } from "@/components/dashboard/maintenance-list"

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
    const [reqRes, statsRes] = await Promise.all([
        getMaintenanceRequests(),
        getMaintenanceStats(),
    ])

    const requests = reqRes.data ?? []
    const stats = statsRes.data ?? { open: 0, inProgress: 0, resolvedThisMonth: 0, avgResolutionDays: 0 }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Maintenance Tracker</h1>
                <p className="text-muted-foreground">Track and manage property maintenance requests</p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                        <Wrench className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.open}</div>
                        <p className="text-xs text-muted-foreground">Awaiting action</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">Being worked on</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolvedThisMonth}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                        <Timer className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgResolutionDays} days</div>
                        <p className="text-xs text-muted-foreground">Average time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Maintenance List (Client Component) */}
            <MaintenanceList requests={requests as any} />
        </div>
    )
}
