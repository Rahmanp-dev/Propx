import { getInquiries, getInquiryStats } from "@/lib/actions/inquiries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Phone, CalendarCheck, CheckCircle } from "lucide-react"
import { InquiriesList } from "@/components/dashboard/inquiries-list"

export const dynamic = 'force-dynamic'

export default async function InquiriesPage() {
    const [inqRes, statsRes] = await Promise.all([
        getInquiries(),
        getInquiryStats(),
    ])

    const inquiries = inqRes.data ?? []
    const statsRaw = statsRes.data ?? {}
    const stats = {
        NEW: (statsRaw as Record<string, number>)["NEW"] ?? 0,
        CONTACTED: (statsRaw as Record<string, number>)["CONTACTED"] ?? 0,
        VIEWING_SCHEDULED: (statsRaw as Record<string, number>)["VIEWING_SCHEDULED"] ?? 0,
        CONVERTED: (statsRaw as Record<string, number>)["CONVERTED"] ?? 0,
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tenant Inquiries</h1>
                <p className="text-muted-foreground">Manage prospective tenant leads and inquiries</p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New</CardTitle>
                        <UserPlus className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.NEW}</div>
                        <p className="text-xs text-muted-foreground">Fresh leads</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                        <Phone className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.CONTACTED}</div>
                        <p className="text-xs text-muted-foreground">Follow-up needed</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-violet-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Viewing Scheduled</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.VIEWING_SCHEDULED}</div>
                        <p className="text-xs text-muted-foreground">Upcoming visits</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Converted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.CONVERTED}</div>
                        <p className="text-xs text-muted-foreground">Became tenants</p>
                    </CardContent>
                </Card>
            </div>

            {/* Inquiries List (Client Component) */}
            <InquiriesList inquiries={inquiries as any} />
        </div>
    )
}
