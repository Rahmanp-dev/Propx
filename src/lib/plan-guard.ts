// Plan guard utilities — imported by both server actions and server components

import prisma from '@/lib/prisma'
import clientPromise from '@/lib/mongo'
import { ObjectId } from 'mongodb'

// ═══════════════════════════════════════════════════════════════
// PLAN CONFIGURATION — Single Source of Truth
// ═══════════════════════════════════════════════════════════════

export const PLAN_CONFIG = {
  FREE: {
    name: 'Free',
    maxUnits: 7,
    maxBuildings: 1,
    features: ['tenant_db', 'manual_rent', 'basic_receipts', 'whatsapp_logs', 'inquiries', 'auto_rent', 'tenant_portal', 'meter_billing', 'whatsapp_auto', 'maintenance', 'branding', 'multi_owner', 'advanced_reports', 'csv_export'],
  },
  STARTER: {
    name: 'Starter',
    maxUnits: 15,
    maxBuildings: 1,
    features: ['tenant_db', 'manual_rent', 'basic_receipts', 'whatsapp_logs', 'inquiries', 'auto_rent', 'tenant_portal', 'meter_billing', 'whatsapp_auto', 'maintenance', 'branding', 'multi_owner', 'advanced_reports', 'csv_export'],
  },
  BUILDER: {
    name: 'Builder',
    maxUnits: 40,
    maxBuildings: 3,
    features: ['tenant_db', 'manual_rent', 'basic_receipts', 'whatsapp_logs', 'inquiries', 'auto_rent', 'tenant_portal', 'meter_billing', 'whatsapp_auto', 'maintenance', 'branding', 'multi_owner', 'advanced_reports', 'csv_export'],
  },
  PORTFOLIO: {
    name: 'Portfolio',
    maxUnits: 99999,
    maxBuildings: 99999,
    features: ['tenant_db', 'manual_rent', 'basic_receipts', 'whatsapp_logs', 'inquiries', 'auto_rent', 'tenant_portal', 'meter_billing', 'whatsapp_auto', 'maintenance', 'branding', 'multi_owner', 'advanced_reports', 'csv_export'],
  },
} as const

export type PlanType = keyof typeof PLAN_CONFIG

// ═══════════════════════════════════════════════════════════════
// PRICING — All 4 plans × 4 billing cycles
// ═══════════════════════════════════════════════════════════════

export const PRICING: Record<string, Record<string, { amount: number; maxUnits: number }>> = {
  FREE: {
    MONTHLY:     { amount: 0, maxUnits: 10 },
    QUARTERLY:   { amount: 0, maxUnits: 10 },
    HALF_YEARLY: { amount: 0, maxUnits: 10 },
    YEARLY:      { amount: 0, maxUnits: 10 },
    ANNUAL:      { amount: 0, maxUnits: 10 },
  },
  STARTER: {
    MONTHLY:     { amount: 499,  maxUnits: 25 },
    QUARTERLY:   { amount: 1349, maxUnits: 25 },
    HALF_YEARLY: { amount: 2549, maxUnits: 25 },
    YEARLY:      { amount: 4999, maxUnits: 25 },
    ANNUAL:      { amount: 4999, maxUnits: 25 },
  },
  BUILDER: {
    MONTHLY:     { amount: 1199,  maxUnits: 60 },
    QUARTERLY:   { amount: 3249,  maxUnits: 60 },
    HALF_YEARLY: { amount: 6149,  maxUnits: 60 },
    YEARLY:      { amount: 11999, maxUnits: 60 },
    ANNUAL:      { amount: 11999, maxUnits: 60 },
  },
  PORTFOLIO: {
    MONTHLY:     { amount: 2499,  maxUnits: 99999 },
    QUARTERLY:   { amount: 6749,  maxUnits: 99999 },
    HALF_YEARLY: { amount: 12749, maxUnits: 99999 },
    YEARLY:      { amount: 24999, maxUnits: 99999 },
    ANNUAL:      { amount: 24999, maxUnits: 99999 },
  },
}

// ═══════════════════════════════════════════════════════════════
// BILLING CYCLE HELPERS
// ═══════════════════════════════════════════════════════════════

export const BILLING_CYCLE_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
  ANNUAL: 12,
}

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
  ANNUAL: 'Yearly',
}

export function calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
  const end = new Date(startDate)
  const months = BILLING_CYCLE_MONTHS[billingCycle] || 1
  end.setMonth(end.getMonth() + months)
  return end
}

// ═══════════════════════════════════════════════════════════════
// UPI INTENT LINK GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateUpiIntentLink(params: {
  upiId: string
  amount: number
  plan: string
  billingCycle: string
}): string {
  const { upiId, amount, plan, billingCycle } = params
  if (amount === 0) return '' // FREE plan — no payment needed
  
  const txnNote = `PropX ${plan} ${BILLING_CYCLE_LABELS[billingCycle] || ''} Subscription`
  
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('PropX')}&am=${amount}&cu=INR&tn=${encodeURIComponent(txnNote)}`
}

// ═══════════════════════════════════════════════════════════════
// PLAN LIMIT CHECKER — Used in createFlat(), createBuilding()
// ═══════════════════════════════════════════════════════════════

export interface PlanLimitStatus {
  canCreateFlat: boolean
  canCreateBuilding: boolean
  currentUnits: number
  maxUnits: number
  currentBuildings: number
  maxBuildings: number
  plan: string
  planStatus: string
  isExpired: boolean
  isSuspended: boolean
  isActive: boolean
  daysUntilExpiry: number | null
  error?: string
}

export async function checkPlanLimits(organizationId: string): Promise<PlanLimitStatus> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        planStatus: true,
        maxUnits: true,
        isActive: true,
        isSuspended: true,
        subscriptionEnd: true,
      },
    })

    if (!org) {
      return {
        canCreateFlat: false,
        canCreateBuilding: false,
        currentUnits: 0,
        maxUnits: 0,
        currentBuildings: 0,
        maxBuildings: 0,
        plan: 'UNKNOWN',
        planStatus: 'UNKNOWN',
        isExpired: true,
        isSuspended: false,
        isActive: false,
        daysUntilExpiry: null,
        error: 'Organization not found',
      }
    }

    // Count current flats (units) across all buildings in this org
    const currentUnits = await prisma.flat.count({
      where: { building: { organizationId } },
    })

    // Count current buildings
    const currentBuildings = await prisma.building.count({
      where: { organizationId },
    })

    const planConfig = PLAN_CONFIG[org.plan as PlanType] || PLAN_CONFIG.FREE
    const maxUnits = org.maxUnits || planConfig.maxUnits
    const maxBuildings = planConfig.maxBuildings

    // Check expiry
    const now = new Date()
    const isExpired = org.plan !== 'FREE' && org.subscriptionEnd ? org.subscriptionEnd < now : false
    const isSuspended = org.isSuspended
    const isActive = org.isActive && !isSuspended && !isExpired && (org.planStatus === 'ACTIVE')

    // Days until expiry
    let daysUntilExpiry: number | null = null
    if (org.subscriptionEnd) {
      daysUntilExpiry = Math.ceil((org.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // FREE plan is always active (no expiry concept)
    const effectiveActive = org.plan === 'FREE' ? true : isActive

    return {
      canCreateFlat: effectiveActive && currentUnits < maxUnits,
      canCreateBuilding: effectiveActive && currentBuildings < maxBuildings,
      currentUnits,
      maxUnits,
      currentBuildings,
      maxBuildings,
      plan: org.plan,
      planStatus: org.planStatus,
      isExpired,
      isSuspended,
      isActive: effectiveActive,
      daysUntilExpiry,
    }
  } catch (error) {
    console.error('checkPlanLimits error:', error)
    return {
      canCreateFlat: false,
      canCreateBuilding: false,
      currentUnits: 0,
      maxUnits: 0,
      currentBuildings: 0,
      maxBuildings: 0,
      plan: 'UNKNOWN',
      planStatus: 'ERROR',
      isExpired: true,
      isSuspended: false,
      isActive: false,
      daysUntilExpiry: null,
      error: 'Failed to check plan limits',
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// REQUIRE ACTIVE PLAN — Throws if plan expired or suspended
// ═══════════════════════════════════════════════════════════════

export async function requireActivePlan(organizationId: string): Promise<PlanLimitStatus> {
  const limits = await checkPlanLimits(organizationId)
  
  if (!limits.isActive) {
    if (limits.isExpired) {
      throw new Error('Your subscription has expired. Please renew to continue.')
    }
    if (limits.isSuspended) {
      throw new Error('Your account has been suspended. Contact support.')
    }
    throw new Error('Your account is not active. Please complete payment setup.')
  }
  
  return limits
}
