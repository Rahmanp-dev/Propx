import { getTenantSession } from "@/lib/tenant-auth"
import { getTenantPayments } from "@/lib/actions/tenant-portal"
import { redirect } from "next/navigation"
import { TenantNav } from "../tenant-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IndianRupee } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
    PAID: "bg-green-100 text-green-700 border-green-200",
    PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING: "bg-red-100 text-red-700 border-red-200",
    OVERDUE: "bg-red-100 text-red-700 border-red-200",
}

export default async function TenantPaymentsPage() {
    const session = await getTenantSession()
    if (!session) redirect('/tenant-portal/login')

    const payments = await getTenantPayments(session.tenantId)

    return (
        <>
            <TenantNav tenantName={session.name} />
            <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
                <h1 className="text-xl font-bold text-gray-900">Payment History</h1>

                {payments.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No payments found
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {payments.map((p: any) => (
                            <Card key={p.id} className="hover:shadow-sm transition">
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">
                                            {new Date(p.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <Badge variant="outline" className={STATUS_COLORS[p.status]}>
                                            {p.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase">Due</p>
                                            <p className="text-sm font-semibold">₹{p.totalDue.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                                            <p className="text-sm font-semibold text-green-600">₹{p.amountPaid.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
                                            <p className={`text-sm font-semibold ${p.balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                ₹{p.balance.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {p.balance > 0 && (
                                        <Link
                                            href={`/pay/${p.id}`}
                                            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                        >
                                            <IndianRupee className="h-3.5 w-3.5" />
                                            Pay ₹{p.balance.toLocaleString()}
                                        </Link>
                                    )}
                                    {p.receiptNumber && (
                                        <p className="mt-2 text-[10px] text-muted-foreground text-center">
                                            Receipt: {p.receiptNumber}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
