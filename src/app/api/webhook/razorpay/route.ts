import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentWebhook } from '@/lib/actions/payment-gateway'
import prisma from '@/lib/prisma'
import clientPromise from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'

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

      let success = false;
      let error = '';
      let receiptNumber = '';

      try {
        const client = await clientPromise
        const db = client.db('propx')
        const paymentsCollection = db.collection('Payment')

        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { flat: { include: { building: { select: { organizationId: true } } } } }
        })

        receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`

        const updateResult = await paymentsCollection.updateOne(
          { _id: new ObjectId(paymentId) },
          {
            $set: {
              amountPaid: amountPaid,
              balance: 0,
              status: 'PAID',
              paymentDate: new Date(),
              paymentMethod: 'UPI',
              receiptNumber: receiptNumber,
              notes: `Paid via Razorpay (${razorpayPaymentId})`,
              updatedAt: new Date(),
            },
          }
        )

        if (updateResult.modifiedCount === 0) {
          success = false;
          error = 'Payment record not found or already updated.';
        } else {
          success = true;

          const notifDoc: Record<string, any> = {
            type: 'PAYMENT_RECEIVED',
            title: 'Online Payment Received',
            message: `Payment of ₹${amountPaid.toLocaleString('en-IN')} received via Razorpay (${receiptNumber})`,
            isRead: false,
            data: JSON.stringify({ paymentId, razorpayPaymentId }),
            createdAt: new Date(),
          }

          if (payment?.flat?.building?.organizationId) {
            notifDoc.organizationId = new ObjectId(payment.flat.building.organizationId)
          }

          await db.collection('Notification').insertOne(notifDoc)

          revalidatePath('/', 'layout')
          revalidatePath(`/pay/${paymentId}`)
        }
      } catch (err: any) {
         success = false;
         error = err.message || 'Failed to process payment.';
      }

      if (!success) {
        console.error('Payment processing failed:', error)
        // Still return 200 to acknowledge receipt to Razorpay
        return NextResponse.json(
          { status: 'processing_failed', error: error },
          { status: 200 }
        )
      }

      console.log(`Payment processed successfully: ${receiptNumber}`)
      return NextResponse.json(
        { status: 'processed', receiptNumber: receiptNumber },
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
