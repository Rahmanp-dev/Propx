import { getFlatDetails } from "@/lib/actions/flat-details"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, CreditCard, History, Zap, KeyRound } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OnboardTenantDialog } from "@/components/dashboard/onboard-tenant-dialog"
import { LogPaymentDialog } from "@/components/dashboard/log-payment-dialog"
import { MeterReadingDialog } from "@/components/dashboard/meter-reading-dialog"
import { PaymentHistoryList } from "@/components/dashboard/payment-history-list"
import { OffboardTenantDialog } from "@/components/dashboard/offboard-tenant-dialog"
import { DeleteFlatDialog } from "@/components/dashboard/delete-flat-dialog"

export const dynamic = 'force-dynamic'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK",
    BHK2: "2 BHK",
    BHK3: "3 BHK",
    STUDIO: "Studio",
    OTHER: "Other",
}

export default async function FlatPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
    const { id, userId } = await params
    const { data: flat, error } = await getFlatDetails(id)

    if (error || !flat) {
        return <div className="p-8 text-center text-muted-foreground">Flat not found</div>
    }

    const tenant = flat.tenants?.[0]
    const currentPayment = flat.payments?.[0]

    return (
        <div className="space-y-6">
            <Link href={`/${userId}/buildings/${flat.buildingId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Building
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Flat {flat.flatNumber}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground">{flat.building.name}</p>
                        <Badge variant="outline" className="text-xs">
                            {FLAT_TYPE_LABELS[(flat as any).flatType] || (flat as any).flatType || ""}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <MeterReadingDialog flatId={id} flatNumber={flat.flatNumber} />
                    <DeleteFlatDialog flatId={id} flatNumber={flat.flatNumber} />
                    <Badge variant={flat.status === "OCCUPIED" ? "default" : "secondary"} className="text-lg px-4 py-1">
                        {flat.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Tenant Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Tenant</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {tenant ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold">{tenant.fullName}</div>
                                    <div className="text-sm text-muted-foreground">{tenant.phone}</div>
                                    {(tenant as any).tenantPin && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <KeyRound className="h-3 w-3 text-amber-600" />
                                            <Badge variant="outline" className="text-xs font-mono bg-amber-50 border-amber-200 text-amber-700">
                                                Login PIN: {(tenant as any).tenantPin}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Move In</span>
                                        {new Date(tenant.leaseStartDate).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Lease End</span>
                                        {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <OffboardTenantDialog flatId={flat.id} tenantName={tenant.fullName} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <p className="mb-4">No active tenant.</p>
                                <OnboardTenantDialog
                                    flatId={flat.id}
                                    suggestedRent={flat.rentAmount}
                                    suggestedDeposit={flat.depositAmount}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Overview */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Financials</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Rent</span>
                                    <div className="text-xl font-bold">₹{flat.rentAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Maintenance</span>
                                    <div className="text-xl font-bold">₹{flat.maintenanceAmount.toLocaleString()}</div>
                                </div>
                            </div>

                            {currentPayment && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm space-y-1">
                                    <div className="font-medium text-muted-foreground mb-2">Current Bill Breakdown</div>
                                    <div className="flex justify-between">
                                        <span>Rent</span>
                                        <span>₹{currentPayment.rentDue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Maintenance</span>
                                        <span>₹{currentPayment.maintenanceDue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Electricity</span>
                                        <span>₹{(currentPayment.electricityDue || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Arrears</span>
                                        <span>₹{((currentPayment as any).arrears || 0).toLocaleString()}</span>
                                    </div>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total Due</span>
                                        <span>₹{currentPayment.totalDue.toLocaleString()}</span>
                                    </div>
                                    {currentPayment.amountPaid > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Paid</span>
                                            <span>₹{currentPayment.amountPaid.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-muted-foreground block">Current Status</span>
                                    <div className="mt-1">
                                        {currentPayment ? (
                                            currentPayment.status === "PAID" ? (
                                                <Badge className="bg-green-600">Paid - No Dues</Badge>
                                            ) : (
                                                <Badge variant="destructive">Due: ₹{currentPayment.balance.toLocaleString()}</Badge>
                                            )
                                        ) : (
                                            <span className="text-sm text-gray-500">No dues generated</span>
                                        )}
                                    </div>
                                </div>
                                {currentPayment && currentPayment.status !== "PAID" && (
                                    <LogPaymentDialog payment={currentPayment as any} />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PaymentHistoryList payments={flat.payments} />
                </CardContent>
            </Card>
        </div>
    )
}
