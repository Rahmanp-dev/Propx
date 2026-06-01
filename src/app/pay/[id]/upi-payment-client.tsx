'use client'

import { useState, useRef } from 'react'
import { uploadPaymentProof } from '@/lib/actions/payment-proof'
import { Smartphone, Copy, Upload, CheckCircle, Wallet, Building2, Camera, Star } from 'lucide-react'

interface PaymentMethod {
    id: string
    type: 'UPI' | 'BANK'
    label: string
    upiId?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolder?: string
    isDefault: boolean
}

interface UpiPaymentClientProps {
    paymentId: string
    amount: number
    upiId: string | null
    upiLink: string | null
    ownerName: string
    bankName: string | null
    accountNumber: string | null
    ifscCode: string | null
    accountHolder: string | null
    paymentInstructions: string | null
    hasExistingProof: boolean
    paymentMethods: PaymentMethod[]
    flatNumber: string
    monthName: string
}

export function UpiPaymentClient({
    paymentId,
    amount,
    upiId,
    upiLink,
    ownerName,
    bankName,
    accountNumber,
    ifscCode,
    accountHolder,
    paymentInstructions,
    hasExistingProof,
    paymentMethods,
    flatNumber,
    monthName,
}: UpiPaymentClientProps) {
    const [copied, setCopied] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [submitted, setSubmitted] = useState(hasExistingProof)
    const [error, setError] = useState<string | null>(null)
    const [utrNumber, setUtrNumber] = useState('')
    const [showBankDetails, setShowBankDetails] = useState(false)
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(() => {
        // Default to the default method, or the first method
        const def = paymentMethods.find(m => m.isDefault)
        return def?.id || paymentMethods[0]?.id || null
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const hasMultipleMethods = paymentMethods.length > 1
    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId) || null

    // Derive active UPI/bank details from selected method OR legacy fields
    const activeUpiId = selectedMethod?.type === 'UPI' ? selectedMethod.upiId : (!selectedMethod ? upiId : null)
    const activeBankName = selectedMethod?.type === 'BANK' ? selectedMethod.bankName : (!selectedMethod ? bankName : null)
    const activeAccountNumber = selectedMethod?.type === 'BANK' ? selectedMethod.accountNumber : (!selectedMethod ? accountNumber : null)
    const activeIfscCode = selectedMethod?.type === 'BANK' ? selectedMethod.ifscCode : (!selectedMethod ? ifscCode : null)
    const activeAccountHolder = selectedMethod?.type === 'BANK' ? selectedMethod.accountHolder : (!selectedMethod ? accountHolder : null)

    // Build UPI deep link for selected method
    const activeUpiLink = activeUpiId
        ? `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(ownerName || 'Owner')}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Rent-${monthName}-Flat-${flatNumber}`)}`
        : null

    const copyUpiId = async () => {
        if (!activeUpiId) return
        try {
            await navigator.clipboard.writeText(activeUpiId)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            const input = document.createElement('input')
            input.value = activeUpiId
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Max 5MB.')
            return
        }

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                throw new Error('Upload failed')
            }

            const { url } = await uploadRes.json()

            const result = await uploadPaymentProof(paymentId, {
                screenshotUrl: url,
                uploadedBy: 'tenant',
                upiTransactionId: utrNumber || undefined,
            })

            if (result.error) {
                setError(result.error)
            } else {
                setSubmitted(true)
            }
        } catch {
            setError('Failed to upload. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    // If proof already submitted
    if (submitted) {
        return (
            <div className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold text-lg">Payment Proof Submitted</h3>
                <p className="text-gray-400 text-sm mt-2">
                    Your payment proof has been submitted. The owner will verify it shortly.
                </p>
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-emerald-400 text-sm">
                        You will be notified once the payment is verified.
                    </p>
                </div>
            </div>
        )
    }

    const hasAnyMethod = activeUpiId || activeBankName || paymentMethods.length > 0

    return (
        <div className="p-4 space-y-4">
            {/* Custom Instructions */}
            {paymentInstructions && (
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <p className="text-blue-300 text-sm">{paymentInstructions}</p>
                </div>
            )}

            {/* Payment Method Selector (only when multiple methods exist) */}
            {hasMultipleMethods && (
                <div className="space-y-2">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                        Select Payment Method
                    </p>
                    <div className="grid gap-2">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethodId(method.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                                    selectedMethodId === method.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                                }`}
                            >
                                {method.type === 'UPI' ? (
                                    <Smartphone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                ) : (
                                    <Building2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white text-sm font-medium truncate">
                                            {method.label}
                                        </span>
                                        {method.isDefault && (
                                            <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-xs truncate mt-0.5">
                                        {method.type === 'UPI'
                                            ? method.upiId
                                            : `${method.bankName || ''} · ****${method.accountNumber?.slice(-4) || ''}`
                                        }
                                    </p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                    selectedMethodId === method.id
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-600'
                                }`}>
                                    {selectedMethodId === method.id && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* UPI Section */}
            {activeUpiId && (
                <div className="space-y-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-400" />
                        Pay via UPI
                    </h3>

                    {/* UPI ID with Copy */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-3">
                        <div className="flex-1">
                            <p className="text-gray-400 text-xs">UPI ID</p>
                            <p className="text-white font-mono text-sm mt-0.5">{activeUpiId}</p>
                        </div>
                        <button
                            onClick={copyUpiId}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                        >
                            {copied ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Copy className="h-4 w-4 text-gray-300" />
                            )}
                        </button>
                    </div>

                    {/* Pay Now Deep Link */}
                    {activeUpiLink && (
                        <a
                            href={activeUpiLink}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
                        >
                            <Smartphone className="h-5 w-5" />
                            Pay ₹{amount.toLocaleString('en-IN')} via UPI App
                        </a>
                    )}

                    <p className="text-gray-500 text-xs text-center">
                        Opens Google Pay, PhonePe, Paytm or your default UPI app
                    </p>
                </div>
            )}

            {/* Bank Details */}
            {activeBankName && activeAccountNumber && (
                <div className="space-y-2">
                    {activeUpiId ? (
                        // Show as collapsible if UPI is also shown
                        <button
                            onClick={() => setShowBankDetails(!showBankDetails)}
                            className="w-full text-left flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm"
                        >
                            <Building2 className="h-4 w-4" />
                            {showBankDetails ? 'Hide' : 'Show'} Bank Transfer Details
                        </button>
                    ) : (
                        <h3 className="text-white font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-400" />
                            Bank Transfer
                        </h3>
                    )}

                    {(!activeUpiId || showBankDetails) && (
                        <div className="bg-gray-800 rounded-xl p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Bank</span>
                                <span className="text-white">{activeBankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Account</span>
                                <span className="text-white font-mono">{activeAccountNumber}</span>
                            </div>
                            {activeIfscCode && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">IFSC</span>
                                    <span className="text-white font-mono">{activeIfscCode}</span>
                                </div>
                            )}
                            {activeAccountHolder && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Name</span>
                                    <span className="text-white">{activeAccountHolder}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* No payment method configured */}
            {!hasAnyMethod && (
                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                    <Wallet className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-300 text-sm font-medium">Payment details not configured</p>
                    <p className="text-amber-400/60 text-xs mt-1">
                        Contact your landlord for payment instructions
                    </p>
                </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-800 pt-4">
                <h3 className="text-white font-medium flex items-center gap-2 mb-3">
                    <Camera className="h-4 w-4 text-blue-400" />
                    Upload Payment Proof
                </h3>
                <p className="text-gray-400 text-xs mb-3">
                    After paying, upload a screenshot of your payment confirmation
                </p>

                {/* UTR Number */}
                <input
                    type="text"
                    placeholder="UTR / Transaction ID (optional)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 mb-3"
                />

                {/* Upload Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-700 border-dashed"
                >
                    {uploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-5 w-5" />
                            Upload Screenshot
                        </>
                    )}
                </button>

                {error && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
