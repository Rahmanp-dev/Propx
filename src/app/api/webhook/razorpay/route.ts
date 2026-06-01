import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentWebhook, processPaymentCapture } from '@/lib/actions/payment-gateway'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const verification = await verifyPaymentWebhook(body, signature)
    if (!verification.valid) {
      console.error('Webhook signature verification failed')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const eventType = event.event

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity
      if (!paymentEntity) {
        return NextResponse.json(
          { error: 'Invalid payment payload' },
          { status: 400 }
        )
      }

      const paymentId = paymentEntity.notes?.payment_id
      if (!paymentId) {
        console.error('Payment ID not found in notes')
        return NextResponse.json(
          { error: 'Payment ID not found in webhook notes' },
          { status: 400 }
        )
      }

      // Convert from paise to rupees
      const amountPaid = paymentEntity.amount / 100
      const razorpayPaymentId = paymentEntity.id

      const result = await processPaymentCapture(paymentId, amountPaid, razorpayPaymentId)

      if (!result.success) {
        console.error('Payment processing failed:', result.error)
        // Still return 200 to acknowledge receipt to Razorpay
        return NextResponse.json(
          { status: 'processing_failed', error: result.error },
          { status: 200 }
        )
      }

      console.log(`Payment processed successfully: ${result.receiptNumber}`)
      return NextResponse.json(
        { status: 'processed', receiptNumber: result.receiptNumber },
        { status: 200 }
      )
    }

    // For other event types, acknowledge receipt
    return NextResponse.json(
      { status: 'acknowledged', event: eventType },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook handler error:', error)
    // Return 200 even on error to prevent Razorpay from retrying
    return NextResponse.json(
      { status: 'error', message: 'Internal processing error' },
      { status: 200 }
    )
  }
}
