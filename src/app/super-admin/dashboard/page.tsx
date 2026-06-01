import { getSuperAdminDashboard } from "@/lib/actions/super-admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Building2, CheckCircle, Clock, IndianRupee } from "lucide-react"
import { DashboardCharts } from "./dashboard-charts"
import { PaymentActionButtons } from "./payment-actions"
import Link from "next/link"

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'VERIFIED':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
        case 'PENDING':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
        case 'REJECTED':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

function getPlanBadge(plan: string) {
    switch (plan) {
        case 'STARTER':
            return <Badge variant="secondary">Starter</Badge>
        case 'BUILDER':
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Builder</Badge>
        case 'PORTFOLIO':
            return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Portfolio</Badge>
        default:
            return <Badge variant="secondary">{plan}</Badge>
    }
}

function getOrgStatusBadge(org: any) {
    if (org.isSuspended) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
    if (org.isActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

export default async function SuperAdminDashboard() {
    const result = await getSuperAdminDashboard()

    if (!result.success || !result.data) {
        return (
            <div className="text-red-500">
                Failed to load dashboard: {result.error || 'Unknown error'}
            </div>
        )
    }

    const {
        totalOrgs,
        activeOrgs,
        pendingOrgs,
        totalRevenue,
        monthlyRevenue,
        planDistribution,
        recentRegistrations,
        recentPayments,
    } = result.data

    const statCards = [
        {
            title: "Total Organizations",
            value: totalOrgs,
            icon: Building2,
            description: `${activeOrgs} active`,
            color: "text-sky-500",
        },
        {
            title: "Active Orgs",
            value: activeOrgs,
            icon: CheckCircle,
            description: "Verified & running",
            color: "text-green-500",
        },
        {
            title: "Pending Verification",
            value: pendingOrgs,
            icon: Clock,
            description: "Awaiting payment verify",
            color: "text-amber-500",
        },
        {
            title: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: IndianRupee,
            description: `${formatCurrency(monthlyRevenue)} this month`,
            color: "text-emerald-500",
        },
    ]

    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Super Admin Dashboard</h2>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Plan Distribution Chart */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
                <DashboardCharts planDistribution={planDistribution} />

                {/* Recent Registrations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Registrations</CardTitle>
                        <CardDescription>Last 10 organizations that signed up</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRegistrations.map((org: any) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/super-admin/organizations/${org.id}`} className="hover:underline">
                                                {org.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{getPlanBadge(org.plan)}</TableCell>
                                        <TableCell>{getOrgStatusBadge(org)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(org.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentRegistrations.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No organizations yet
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Subscription Payments</CardTitle>
                    <CardDescription>Latest payment submissions from organizations</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentPayments.map((payment: any) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        {payment.organization?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell>{getPlanBadge(payment.plan)}</TableCell>
                                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(payment.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {payment.status === 'PENDING' && (
                                            <PaymentActionButtons paymentId={payment.id} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {recentPayments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No payments yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
