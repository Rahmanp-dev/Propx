import { getAllPayments } from "@/lib/actions/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { IndianRupee } from "lucide-react"
import { PaymentActionButtons } from "../dashboard/payment-actions"
import { PaymentFilters } from "./payment-filters"
import { ScreenshotViewer } from "./screenshot-viewer"

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

export default async function PaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const params = await searchParams
    const result = await getAllPayments(params.status)

    if (!result.success || !result.data) {
        return <div className="text-red-500">Failed to load payments: {result.error}</div>
    }

    const payments = result.data

    // Compute summary
    const pendingCount = payments.filter((p: any) => p.status === 'PENDING').length
    const verifiedCount = payments.filter((p: any) => p.status === 'VERIFIED').length
    const totalVerified = payments
        .filter((p: any) => p.status === 'VERIFIED')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subscription Payments</h2>
                    <p className="text-muted-foreground">Manage all subscription payments across organizations</p>
                </div>
                <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{payments.length} payments</span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Pending Verification</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
                        <p className="text-xs text-muted-foreground">Verified Payments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalVerified)}</div>
                        <p className="text-xs text-muted-foreground">Total Verified Revenue</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <PaymentFilters currentStatus={params.status} />

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Cycle</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Screenshot</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment: any) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        {payment.organization?.name || 'N/A'}
                                        <div className="text-xs text-muted-foreground">
                                            {payment.organization?.email || ''}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPlanBadge(payment.plan)}</TableCell>
                                    <TableCell className="text-sm">
                                        {({'MONTHLY':'Monthly','QUARTERLY':'Quarterly','HALF_YEARLY':'Half-Yearly','YEARLY':'Yearly'} as Record<string, string>)[payment.billingCycle] || payment.billingCycle}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell>
                                        {payment.screenshotUrl ? (
                                            <ScreenshotViewer
                                                url={payment.screenshotUrl}
                                                orgName={payment.organization?.name || 'Payment'}
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(payment.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {payment.status === 'PENDING' && (
                                            <PaymentActionButtons paymentId={payment.id} />
                                        )}
                                        {payment.notes && (
                                            <div className="text-xs text-muted-foreground mt-1 italic">
                                                {payment.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                                        No payments found
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
