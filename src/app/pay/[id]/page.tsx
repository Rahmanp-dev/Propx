import { getPaymentForPublicPage } from "@/lib/actions/payment-gateway"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Building2, Calendar, Smartphone, CreditCard, Copy } from "lucide-react"
import { UpiPaymentClient } from "./upi-payment-client"

export const dynamic = 'force-dynamic'

const FLAT_TYPE_LABELS: Record<string, string> = {
    BHK1: "1 BHK", BHK2: "2 BHK", BHK3: "3 BHK", STUDIO: "Studio",
}

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await getPaymentForPublicPage(id)

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <Card className="w-full max-w-md bg-gray-900 border-gray-800">
                    <CardContent className="pt-6 text-center">
                        <p className="text-red-400 font-medium">Payment not found</p>
                        <p className="text-sm text-gray-500 mt-2">This payment link may have expired or is invalid.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const payment = result.data
    const monthName = new Date(payment.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

    // Build UPI deep link (using default UPI ID)
    const upiDeepLink = payment.upiId
        ? `upi://pay?pa=${encodeURIComponent(payment.upiId)}&pn=${encodeURIComponent(payment.ownerName || 'Owner')}&am=${payment.balance}&cu=INR&tn=${encodeURIComponent(`Rent-${monthName}-Flat-${payment.flatNumber}`)}`
        : null

    const hasProofs = payment.paymentProofs && payment.paymentProofs.length > 0
    const hasVerifiedProof = payment.paymentProofs?.some((p: any) => p.isVerified)

    // Prepare payment methods array for the client component
    const paymentMethods = payment.paymentMethods || []

    if (payment.status === 'PAID') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-3">
                            <span className="text-white font-bold text-lg">PX</span>
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 text-center">
                            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-3" />
                            <h1 className="text-2xl font-bold text-emerald-400">Payment Complete</h1>
                            <p className="text-gray-400 mt-2">₹{payment.amountPaid.toLocaleString('en-IN')} received for {monthName}</p>
                            <div className="text-sm text-gray-500 mt-1">
                                {payment.tenantName} • Flat {payment.flatNumber} • {payment.buildingName}
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 text-xs mt-4">
                        Powered by PropX
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="w-full max-w-md space-y-4">
                {/* Header */}
                <div className="text-center mb-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
                        <span className="text-white font-bold text-lg">PX</span>
                    </div>
                    <h1 className="text-lg font-semibold text-white">Rent Payment</h1>
                </div>

                {/* Payment Details Card */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    {/* Tenant & Flat Info */}
                    <div className="p-4 border-b border-gray-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white font-medium">{payment.tenantName}</p>
                                <p className="text-gray-400 text-sm">
                                    Flat {payment.flatNumber} · {FLAT_TYPE_LABELS[payment.flatType] || payment.flatType}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-xs text-gray-400">{monthName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{payment.buildingName}</span>
                        </div>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Due</span>
                            <span className="text-white">₹{payment.totalDue.toLocaleString('en-IN')}</span>
                        </div>
                        {payment.amountPaid > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-emerald-400">Already Paid</span>
                                <span className="text-emerald-400">-₹{payment.amountPaid.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Balance Due</span>
                            <span className="text-orange-400 font-bold text-xl">₹{payment.balance.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <div className="px-4 pb-3">
                        <Badge
                            variant={payment.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                            className="w-full justify-center py-1"
                        >
                            {payment.status}
                        </Badge>
                    </div>
                </div>

                {/* UPI / Bank Payment Section — Client Component with all methods */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                    <UpiPaymentClient
                        paymentId={id}
                        amount={payment.balance}
                        upiId={payment.upiId}
                        upiLink={upiDeepLink}
                        ownerName={payment.ownerName || ''}
                        bankName={payment.bankName}
                        accountNumber={payment.accountNumber}
                        ifscCode={payment.ifscCode}
                        accountHolder={payment.accountHolder}
                        paymentInstructions={payment.paymentInstructions}
                        hasExistingProof={hasVerifiedProof || false}
                        paymentMethods={paymentMethods}
                        flatNumber={payment.flatNumber}
                        monthName={monthName}
                    />
                </div>



                {/* Show existing proof status */}
                {hasProofs && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                        <h3 className="text-white font-medium text-sm mb-3">Submitted Proofs</h3>
                        <div className="space-y-2">
                            {payment.paymentProofs.map((proof: any) => (
                                <div key={proof.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{proof.isVerified ? '✅' : '⏳'}</span>
                                        <div>
                                            <p className="text-white text-sm">
                                                {proof.isVerified ? 'Verified' : 'Pending verification'}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {new Date(proof.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs">
                    Powered by PropX · Smart Property Management
                </p>
            </div>
        </div>
    )
}
