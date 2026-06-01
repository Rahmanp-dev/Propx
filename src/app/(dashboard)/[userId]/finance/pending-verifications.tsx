'use client'

import { useState } from 'react'
import { verifyPaymentProof } from '@/lib/actions/payment-proof'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, ImageIcon } from 'lucide-react'

interface PaymentProofData {
    id: string
    screenshotUrl: string
    upiTransactionId: string | null
    isVerified: boolean
    createdAt: Date
    payment: {
        id: string
        totalDue: number
        amountPaid: number
        balance: number
        month: Date
        tenant: {
            fullName: string
            phone: string
        }
        flat: {
            flatNumber: string
            flatType: string
            building: {
                name: string
            }
        }
    }
}

interface PendingVerificationsProps {
    proofs: PaymentProofData[]
}

export function PendingVerifications({ proofs }: PendingVerificationsProps) {
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleVerify = async (proofId: string, verified: boolean) => {
        setProcessingId(proofId)
        try {
            const result = await verifyPaymentProof(proofId, verified, verified ? undefined : 'Rejected by owner')
            if (result.success) {
                setDismissed(prev => new Set(prev).add(proofId))
            }
        } catch (err) {
            console.error('Failed to verify:', err)
        } finally {
            setProcessingId(null)
        }
    }

    const visibleProofs = proofs.filter(p => !dismissed.has(p.id))

    if (visibleProofs.length === 0) return null

    return (
        <>
            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-lg text-amber-900">
                            Pending Verification ({visibleProofs.length})
                        </CardTitle>
                    </div>
                    <p className="text-sm text-amber-700">
                        Tenants have uploaded payment proofs. Review and verify below.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {visibleProofs.map((proof) => {
                        const monthLabel = new Date(proof.payment.month).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                        })

                        return (
                            <div
                                key={proof.id}
                                className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                {/* Screenshot Preview */}
                                <button
                                    onClick={() => setPreviewUrl(proof.screenshotUrl)}
                                    className="shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
                                >
                                    {proof.screenshotUrl.startsWith('data:') ? (
                                        <img
                                            src={proof.screenshotUrl}
                                            alt="Payment proof"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                </button>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm">{proof.payment.tenant.fullName}</span>
                                        <Badge variant="outline" className="text-xs">
                                            Flat {proof.payment.flat.flatNumber}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {proof.payment.flat.building.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span>₹{proof.payment.totalDue.toLocaleString('en-IN')}</span>
                                        <span>•</span>
                                        <span>{monthLabel}</span>
                                        {proof.upiTransactionId && (
                                            <>
                                                <span>•</span>
                                                <span className="font-mono text-xs">UTR: {proof.upiTransactionId}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={processingId === proof.id}
                                        onClick={() => handleVerify(proof.id, false)}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        disabled={processingId === proof.id}
                                        onClick={() => handleVerify(proof.id, true)}
                                    >
                                        {processingId === proof.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                        )}
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Screenshot Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 border-b flex justify-between items-center">
                            <span className="text-sm font-medium">Payment Screenshot</span>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[70vh]">
                            <img
                                src={previewUrl}
                                alt="Payment proof"
                                className="w-full rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
