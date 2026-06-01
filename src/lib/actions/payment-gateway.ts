'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import clientPromise from '@/lib/mongo'
import { getRazorpayClient, isRazorpayConfigured } from '@/lib/razorpay'
import { ObjectId } from 'mongodb'
import { auth } from '@/lib/auth'

async function getOrgContext() {
  const session = await auth()
  if (!session?.user) return null
  const user = session.user as any
  return {
    userId: user.id,
    role: user.role as string,
    organizationId: user.organizationId as string | null,
    isSuperAdmin: user.role === 'SUPER_ADMIN',
  }
}

// Create a Razorpay payment link for a specific Payment record
export async function createPaymentLink(paymentId: string) {
  try {
    if (!isRazorpayConfigured()) {
      return { success: false, error: 'Razorpay is not configured. Please set up your API keys in Settings.' }
    }

    const razorpay = await getRazorpayClient()
    if (!razorpay) {
      return { success: false, error: 'Failed to initialize Razorpay client.' }
    }

    // Fetch payment details with tenant and flat info
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenant: true,
        flat: true,
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment record not found.' }
    }

    if (payment.status === 'PAID') {
      return { success: false, error: 'This payment has already been completed.' }
    }

    const amountDue = payment.totalDue - payment.amountPaid
    if (amountDue <= 0) {
      return { success: false, error: 'No balance due for this payment.' }
    }

    // Create Razorpay payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(amountDue * 100), // Razorpay expects amount in paise
      currency: 'INR',
      description: `Rent for Flat ${payment.flat.flatNumber} — ${new Date(payment.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
      customer: {
        name: payment.tenant.fullName,
        contact: payment.tenant.phone,
        ...(payment.tenant.email ? { email: payment.tenant.email } : {}),
      },
      notify: {
        sms: true,
        email: !!payment.tenant.email,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentId}?status=success`,
      callback_method: 'get',
      notes: {
        payment_id: paymentId,
        tenant_id: payment.tenantId,
        flat_id: payment.flatId,
        flat_number: payment.flat.flatNumber,
      },
    })

    revalidatePath('/pay/[id]', 'page')

    return {
      success: true,
      paymentUrl: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
    }
  } catch (error) {
    console.error('Error creating payment link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment link.',
    }
  }
}

// Verify Razorpay webhook signature
export async function verifyPaymentWebhook(body: string, signature: string) {
  try {
    const crypto = await import('crypto')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      return { valid: false, error: 'Webhook secret not configured.' }
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    const isValid = expectedSignature === signature

    return { valid: isValid }
  } catch (error) {
    console.error('Error verifying webhook:', error)
    return { valid: false, error: 'Verification failed.' }
  }
}

// Process a successful payment from webhook
export async function processPaymentCapture(
  paymentId: string,
  amountPaid: number,
  razorpayPaymentId: string
) {
  try {
    const client = await clientPromise
    const db = client.db('propx')
    const paymentsCollection = db.collection('Payment')

    // Get payment to find org for notification
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { flat: { include: { building: { select: { organizationId: true } } } } }
    })

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`

    // Update payment record
    const result = await paymentsCollection.updateOne(
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

    if (result.modifiedCount === 0) {
      return { success: false, error: 'Payment record not found or already updated.' }
    }

    // Create a notification with organizationId
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

    revalidatePath('/dashboard')
    revalidatePath('/(dashboard)/finance', 'page')
    revalidatePath(`/pay/${paymentId}`)

    return { success: true, receiptNumber }
  } catch (error) {
    console.error('Error processing payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment.',
    }
  }
}

// Fetch payment details for public payment page — includes org payment config for UPI
export async function getPaymentForPublicPage(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenant: { select: { fullName: true } },
        flat: {
          select: {
            flatNumber: true,
            flatType: true,
            building: {
              select: {
                name: true,
                organization: {
                  select: {
                    ownerName: true,
                    upiId: true,
                    bankName: true,
                    accountNumber: true,
                    ifscCode: true,
                    accountHolder: true,
                    paymentInstructions: true,
                    paymentMethods: true,
                  }
                }
              }
            }
          }
        },
        paymentProofs: {
          select: {
            id: true,
            screenshotUrl: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }
      }
    })

    if (!payment) return { error: 'Payment not found' }

    const org = payment.flat.building.organization

    return {
      success: true,
      data: {
        id: payment.id,
        tenantName: payment.tenant.fullName,
        flatNumber: payment.flat.flatNumber,
        flatType: payment.flat.flatType,
        buildingName: payment.flat.building.name,
        month: payment.month,
        totalDue: payment.totalDue,
        amountPaid: payment.amountPaid,
        balance: payment.balance,
        status: payment.status,
        isRazorpayConfigured: isRazorpayConfigured(),
        // UPI / org payment details
        upiId: org?.upiId || null,
        ownerName: org?.ownerName || null,
        bankName: org?.bankName || null,
        accountNumber: org?.accountNumber || null,
        ifscCode: org?.ifscCode || null,
        accountHolder: org?.accountHolder || null,
        paymentInstructions: org?.paymentInstructions || null,
        // Multiple payment methods
        paymentMethods: (org?.paymentMethods as any[]) || [],
        // Existing proofs
        paymentProofs: payment.paymentProofs,
      }
    }
  } catch (error: any) {
    return { error: `Failed to fetch payment: ${error.message}` }
  }
}
