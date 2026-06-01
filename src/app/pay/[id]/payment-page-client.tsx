'use client'

import { useState } from 'react'
import { createPaymentLink } from '@/lib/actions/payment-gateway'

interface PaymentData {
  id: string
  month: string
  rentDue: number
  maintenanceDue: number
  electricityDue: number
  totalDue: number
  amountPaid: number
  balance: number
  status: string
  paymentDate: string | null
  receiptNumber: string | null
  tenantName: string
  tenantPhone: string
  flatNumber: string
  flatType: string
}

interface PaymentPageClientProps {
  payment: PaymentData
  razorpayConfigured: boolean
  razorpayKeyId: string
  successRedirect: boolean
}

export function PaymentPageClient({
  payment,
  razorpayConfigured,
  successRedirect,
}: PaymentPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = payment.status === 'PAID' || successRedirect
  const balanceDue = payment.totalDue - payment.amountPaid

  const monthLabel = new Date(payment.month).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const flatTypeLabel: Record<string, string> = {
    STUDIO: 'Studio',
    BHK1: '1 BHK',
    BHK2: '2 BHK',
    BHK3: '3 BHK',
    OTHER: 'Other',
  }

  const handlePayNow = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await createPaymentLink(payment.id)
      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else {
        setError(result.error || 'Failed to create payment link.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
            <span className="text-white font-bold text-lg">PX</span>
          </div>
          <h1 className="text-lg font-semibold text-white">PropX Payments</h1>
        </div>

        {/* Payment Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* Status Banner */}
          {isPaid ? (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-lg font-bold text-emerald-400">Payment Complete</h2>
              {payment.receiptNumber && (
                <p className="text-emerald-400/70 text-sm mt-1">
                  Receipt: {payment.receiptNumber}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-blue-500/10 border-b border-blue-500/20 p-4 text-center">
              <h2 className="text-lg font-bold text-blue-400">Payment Due</h2>
              <p className="text-blue-400/70 text-sm mt-1">{monthLabel}</p>
            </div>
          )}

          {/* Tenant & Flat Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium">{payment.tenantName}</p>
                <p className="text-gray-400 text-sm">
                  Flat {payment.flatNumber} · {flatTypeLabel[payment.flatType] || payment.flatType}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                {monthLabel}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rent</span>
              <span className="text-white">₹{payment.rentDue.toLocaleString('en-IN')}</span>
            </div>
            {payment.maintenanceDue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Maintenance</span>
                <span className="text-white">₹{payment.maintenanceDue.toLocaleString('en-IN')}</span>
              </div>
            )}
            {payment.electricityDue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Electricity</span>
                <span className="text-white">₹{payment.electricityDue.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-gray-800 pt-3 flex justify-between">
              <span className="text-gray-300 font-medium">Total Due</span>
              <span className="text-white font-bold text-lg">
                ₹{payment.totalDue.toLocaleString('en-IN')}
              </span>
            </div>
            {payment.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Amount Paid</span>
                  <span className="text-emerald-400">
                    -₹{payment.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                {!isPaid && (
                  <div className="flex justify-between">
                    <span className="text-orange-400 font-medium">Balance</span>
                    <span className="text-orange-400 font-bold">
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Area */}
          <div className="p-4 border-t border-gray-800">
            {isPaid ? (
              <div className="text-center py-2">
                <p className="text-gray-400 text-sm">
                  {payment.paymentDate
                    ? `Paid on ${new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}`
                    : 'Payment has been received. Thank you!'}
                </p>
              </div>
            ) : !razorpayConfigured ? (
              <div className="text-center py-3 bg-gray-800/50 rounded-xl">
                <p className="text-gray-400 text-sm">🔒 Online payments coming soon</p>
                <p className="text-gray-500 text-xs mt-1">Please pay via cash, UPI, or bank transfer</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                <button
                  onClick={handlePayNow}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating payment link...
                    </>
                  ) : (
                    <>Pay ₹{balanceDue.toLocaleString('en-IN')} Now</>
                  )}
                </button>
                <p className="text-gray-500 text-xs text-center mt-3">
                  Secured by Razorpay · UPI, Cards, Net Banking
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-4">
          Powered by PropX · Smart Property Management
        </p>
      </div>
    </div>
  )
}
