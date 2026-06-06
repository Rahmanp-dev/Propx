'use server'

import clientPromise from '@/lib/mongo'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'
import { PRICING, calculatePeriodEnd, generateUpiIntentLink } from '@/lib/plan-guard'

const PLATFORM_UPI_ID = process.env.PLATFORM_UPI_ID || 'propx@upi'

export async function registerOrganization(data: {
  ownerName: string
  businessName: string
  email: string
  phone: string
  city: string
  plan: 'FREE' | 'STARTER' | 'BUILDER' | 'PORTFOLIO'
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
  password: string
}) {
  try {
    // 1. Check if email already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { email: data.email },
    })
    if (existingOrg) {
      return { success: false, error: 'An organization with this email already exists.' }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return { success: false, error: 'A user with this email already exists.' }
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // 3. Get pricing info
    const pricing = PRICING[data.plan]?.[data.billingCycle]
    if (!pricing) {
      return { success: false, error: 'Invalid plan or billing cycle.' }
    }

    const isFree = data.plan === 'FREE'
    const client = await clientPromise
    const db = client.db('propx')

    // Fetch dynamic platform settings
    const settings = await db.collection('PlatformSettings').findOne({ key: 'platform' })
    const activeUpiId = settings?.upiId || PLATFORM_UPI_ID

    // 4. Create Organization
    const orgId = new ObjectId()
    const now = new Date()

    await db.collection('Organization').insertOne({
      _id: orgId,
      name: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      city: data.city || 'Hyderabad',
      plan: data.plan,
      planStatus: isFree ? 'ACTIVE' : 'PENDING_PAYMENT',
      maxUnits: pricing.maxUnits,
      billingCycle: isFree ? 'MONTHLY' : data.billingCycle,
      subscriptionStart: isFree ? now : null,
      subscriptionEnd: isFree ? null : null, // FREE never expires
      upiId: null,
      bankName: null,
      accountNumber: null,
      ifscCode: null,
      accountHolder: null,
      paymentInstructions: null,
      paymentMethods: null,
      isActive: isFree, // FREE plan auto-activates
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    })

    // 5. Create User with role OWNER, linked to org
    const userId = new ObjectId()
    await db.collection('User').insertOne({
      _id: userId,
      name: data.ownerName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: 'OWNER',
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    })

    revalidatePath('/', 'layout')

    // Generate UPI intent link for paid plans
    const upiIntentLink = isFree ? '' : generateUpiIntentLink({
      upiId: activeUpiId,
      amount: pricing.amount,
      plan: data.plan,
      billingCycle: data.billingCycle,
    })

    return {
      success: true,
      organizationId: orgId.toString(),
      amount: pricing.amount,
      upiId: activeUpiId,
      upiIntentLink,
      isFree,
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

export async function uploadSubscriptionProof(
  orgId: string,
  data: {
    screenshotUrl: string
    upiTransactionId?: string
  }
) {
  try {
    const client = await clientPromise
    const db = client.db('propx')

    // Verify org exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    })
    if (!org) {
      return { success: false, error: 'Organization not found.' }
    }

    // Calculate period dates using the centralized helper
    const periodStart = new Date()
    const periodEnd = calculatePeriodEnd(periodStart, org.billingCycle)

    const pricing = PRICING[org.plan]?.[org.billingCycle]
    if (!pricing) {
      return { success: false, error: 'Invalid plan configuration.' }
    }

    // Create SubscriptionPayment record
    await db.collection('SubscriptionPayment').insertOne({
      _id: new ObjectId(),
      organizationId: new ObjectId(orgId),
      amount: pricing.amount,
      plan: org.plan,
      billingCycle: org.billingCycle,
      upiTransactionId: data.upiTransactionId || null,
      screenshotUrl: data.screenshotUrl,
      status: 'PENDING',
      verifiedBy: null,
      verifiedAt: null,
      periodStart,
      periodEnd,
      notes: null,
      createdAt: new Date(),
    })

    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Upload proof error:', error)
    return { success: false, error: 'Failed to upload payment proof.' }
  }
}
