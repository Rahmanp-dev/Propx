import { getOrganizationDetail } from "@/lib/actions/super-admin"
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
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Mail, MapPin, Phone, User } from "lucide-react"
import Link from "next/link"
import { OrgStatusToggle } from "./org-status-toggle"
import { PaymentActionButtons } from "../../dashboard/payment-actions"

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateStr: string) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
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

function getStatusBadge(org: any) {
    if (org.isSuspended) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
    if (org.isActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

function getPaymentStatusBadge(status: string) {
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

function getPlanStatusBadge(status: string) {
    switch (status) {
        case 'ACTIVE':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
        case 'PENDING_PAYMENT':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Payment</Badge>
        case 'EXPIRED':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>
        case 'CANCELLED':
            return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelled</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

export default async function OrganizationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const result = await getOrganizationDetail(id)

    if (!result.success || !result.data) {
        return (
            <div>
                <Link href="/super-admin/organizations">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Organizations
                    </Button>
                </Link>
                <div className="text-red-500">{result.error || 'Organization not found'}</div>
            </div>
        )
    }

    const org = result.data
    const owner = org.users?.find((u: any) => u.role === 'OWNER')

    return (
        <div>
            <Link href="/super-admin/organizations">
                <Button variant="ghost" className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Organizations
                </Button>
            </Link>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{org.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(org)}
                        {getPlanBadge(org.plan)}
                        {getPlanStatusBadge(org.planStatus)}
                    </div>
                </div>
                <OrgStatusToggle orgId={org.id} isActive={org.isActive} isSuspended={org.isSuspended} planStatus={org.planStatus} />
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
                {/* Organization Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Organization Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Owner</div>
                                <div className="text-sm text-muted-foreground">{org.ownerName}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Email</div>
                                <div className="text-sm text-muted-foreground">{org.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Phone</div>
                                <div className="text-sm text-muted-foreground">{org.phone}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">City</div>
                                <div className="text-sm text-muted-foreground">{org.city}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium">Units</div>
                                <div className="text-sm text-muted-foreground">{org.unitCount} / {org.maxUnits} max</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Subscription Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium">Plan</div>
                                <div className="mt-1">{getPlanBadge(org.plan)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Billing Cycle</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {({'MONTHLY':'Monthly','QUARTERLY':'Quarterly','HALF_YEARLY':'Half-Yearly','YEARLY':'Yearly'} as Record<string, string>)[org.billingCycle] || org.billingCycle}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Plan Status</div>
                                <div className="mt-1">{getPlanStatusBadge(org.planStatus)}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Max Units</div>
                                <div className="text-sm text-muted-foreground mt-1">{org.maxUnits}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Subscription Start</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {formatDate(org.subscriptionStart)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Subscription End</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {formatDate(org.subscriptionEnd)}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Created: {formatDate(org.createdAt)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Users ({org.users?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {org.users?.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Buildings */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Buildings ({org.buildings?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {org.buildings?.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead className="text-center">Floors</TableHead>
                                    <TableHead className="text-center">Flats</TableHead>
                                    <TableHead className="text-center">Occupancy</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {org.buildings.map((building: any) => (
                                    <TableRow key={building.id}>
                                        <TableCell className="font-medium">{building.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{building.address}</TableCell>
                                        <TableCell className="text-center">{building.totalFloors}</TableCell>
                                        <TableCell className="text-center">{building.totalFlats}</TableCell>
                                        <TableCell className="text-center">
                                            {Math.round(building.occupancyRate * 100)}%
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(building.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No buildings yet</p>
                    )}
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Payment History ({org.subscriptionPayments?.length || 0})
                    </CardTitle>
                    <CardDescription>Subscription payments from this organization</CardDescription>
                </CardHeader>
                <CardContent>
                    {org.subscriptionPayments?.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Cycle</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {org.subscriptionPayments.map((payment: any) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{getPlanBadge(payment.plan)}</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell className="text-sm">
                                            {({'MONTHLY':'Monthly','QUARTERLY':'Quarterly','HALF_YEARLY':'Half-Yearly','YEARLY':'Yearly'} as Record<string, string>)[payment.billingCycle] || payment.billingCycle}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                                        </TableCell>
                                        <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
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
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No payments yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
