import { getTenantLedger, getAllTenants } from "@/lib/actions/ledger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function LedgerPage({ params, searchParams }: { params: Promise<{ userId: string }>, searchParams: Promise<{ tenantId?: string }> }) {
    const { userId } = await params
    const resolvedSearchParams = await searchParams
    const tenantId = resolvedSearchParams.tenantId

    const { data: tenants, error: tenantsError } = await getAllTenants()

    let ledgerData = null
    let tenantDetails = null
    if (tenantId) {
        const { data, error } = await getTenantLedger(tenantId)
        if (data) {
            ledgerData = data.payments
            tenantDetails = data.tenant
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tenant Ledger</h1>
                <p className="text-muted-foreground">View the running balance and payment history for tenants.</p>
            </div>

            <div className="flex gap-4">
                <Card className="w-1/3 h-fit">
                    <CardHeader>
                        <CardTitle>Select Tenant</CardTitle>
                        <CardDescription>Choose a tenant to view their ledger</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {tenants?.map(tenant => (
                            <Link key={tenant.id} href={`/${userId}/ledger?tenantId=${tenant.id}`} className="block">
                                <Button 
                                    variant={tenant.id === tenantId ? "default" : "outline"} 
                                    className="w-full justify-start text-left h-auto py-3"
                                >
                                    <div>
                                        <div className="font-medium">{tenant.fullName}</div>
                                        <div className="text-xs opacity-80">
                                            {tenant.flat ? `${tenant.flat.building.name} - Flat ${tenant.flat.flatNumber}` : 'Unassigned'}
                                        </div>
                                    </div>
                                </Button>
                            </Link>
                        ))}
                        {tenants?.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">No tenants found.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="w-2/3">
                    <CardHeader>
                        <CardTitle>
                            {tenantDetails ? `Ledger: ${tenantDetails.fullName}` : "Ledger Details"}
                        </CardTitle>
                        {tenantDetails && (
                            <CardDescription>
                                {tenantDetails.flat ? `${tenantDetails.flat.building.name} - Flat ${tenantDetails.flat.flatNumber}` : ''}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {ledgerData ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead className="text-right">Total Due</TableHead>
                                            <TableHead className="text-right">Paid</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date & Method</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledgerData.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">
                                                    {format(new Date(payment.month), "MMM yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right">₹{payment.totalDue.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {payment.balance > 0 ? `₹${payment.balance.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={payment.status === "PAID" ? "default" : (payment.status === "PARTIAL" ? "secondary" : "destructive")}>
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {payment.paymentDate ? (
                                                        <>
                                                            {format(new Date(payment.paymentDate), "dd MMM yy")}
                                                            <br />
                                                            <span className="text-muted-foreground">{payment.paymentMethod}</span>
                                                        </>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {ledgerData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No payment records found for this tenant.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Select a tenant to view their ledger.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
