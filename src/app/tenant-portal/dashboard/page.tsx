import { auth } from "@/lib/auth"
import { getTenantDashboard } from "@/lib/actions/tenant-portal"
import { redirect } from "next/navigation"
import { TenantNav } from "../tenant-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, IndianRupee, Wrench, Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK", BHK2: "2 BHK", BHK3: "3 BHK", STUDIO: "Studio",
}

const STATUS_COLORS: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-amber-100 text-amber-700",
    PENDING: "bg-red-100 text-red-700",
    OVERDUE: "bg-red-100 text-red-700",
}

export default async function TenantDashboardPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/tenant-portal/login')

    const data = await getTenantDashboard(session.user.id)
    if (!data) {
        return <div className="p-4 text-red-500">Error loading dashboard</div>
    }

    const { tenant, flat, building, currentPayment } = data

    return (
        <>
            <TenantNav tenantName={tenant.fullName} />
            <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hello, {tenant.fullName.split(' ')[0]} 👋</h1>
                    <p className="text-sm text-muted-foreground mt-1">Here's your property summary</p>
                </div>

                {/* Rent Status */}
                {currentPayment ? (
                    <Card className={`border-l-4 ${currentPayment.status === 'PAID' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">
                                    {new Date(currentPayment.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </span>
                                <Badge className={STATUS_COLORS[currentPayment.status]}>
                                    {currentPayment.status}
                                </Badge>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Balance Due</p>
                                    <p className={`text-2xl font-bold ${currentPayment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{currentPayment.balance.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Due</p>
                                    <p className="text-sm font-medium">₹{currentPayment.totalDue.toLocaleString()}</p>
                                </div>
                            </div>
                            {currentPayment.balance > 0 && (
                                <Link
                                    href={`/pay/${currentPayment.id}`}
                                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    <IndianRupee className="h-4 w-4" />
                                    Pay Now
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="pt-4 text-center text-muted-foreground py-6">
                            No dues for this month
                        </CardContent>
                    </Card>
                )}

                {/* Flat Info */}
                {flat && building && (
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{building.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Flat {flat.flatNumber} • {FLAT_TYPE_LABELS[flat.flatType] || flat.flatType}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/tenant-portal/payments">
                        <Card className="hover:shadow-md transition cursor-pointer">
                            <CardContent className="pt-4 flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Payments</p>
                                    <p className="text-xs text-muted-foreground">View history</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/tenant-portal/maintenance">
                        <Card className="hover:shadow-md transition cursor-pointer">
                            <CardContent className="pt-4 flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Wrench className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Maintenance</p>
                                    <p className="text-xs text-muted-foreground">Requests</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
        </>
    )
}
