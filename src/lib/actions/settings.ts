'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"

const updateOwnerPaymentConfigSchema = z.object({
    upiId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountHolder: z.string().optional(),
    paymentInstructions: z.string().optional(),
})

const addPaymentMethodSchema = z.object({
    type: z.enum(['UPI', 'BANK']),
    label: z.string().min(1),
    upiId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountHolder: z.string().optional(),
})

// ==========================================
// OWNER PAYMENT CONFIG
// ==========================================

export async function getOwnerPaymentConfig() {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const user = session.user as any
    const orgId = user.organizationId
    if (!orgId) return { error: "No organization" }

    try {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                upiId: true,
                bankName: true,
                accountNumber: true,
                ifscCode: true,
                accountHolder: true,
                paymentInstructions: true,
                paymentMethods: true,
            }
        })

        return { success: true, data: org }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateOwnerPaymentConfig(data: {
    upiId?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolder?: string
    paymentInstructions?: string
}) {
    const session = await auth()
    if (!session?.user) return { error: "Not authenticated" }

    const user = session.user as any
    const orgId = user.organizationId
    if (!orgId) return { error: "No organization" }

    const result = updateOwnerPaymentConfigSchema.safeParse(data)
    if (!result.success) return { error: "Invalid input data" }
    const parsedData = result.data

    try {
        const client = await clientPromise
        const db = client.db("propx")

        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            {
                $set: {
                    upiId: parsedData.upiId || null,
                    bankName: parsedData.bankName || null,
                    accountNumber: parsedData.accountNumber || null,
                    ifscCode: parsedData.ifscCode || null,
                    accountHolder: parsedData.accountHolder || null,
                    paymentInstructions: parsedData.paymentInstructions || null,
                    updatedAt: new Date(),
                }
            }
        )

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

// ==========================================
// MULTI PAYMENT METHODS CRUD
// ==========================================

export interface PaymentMethodEntry {
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

async function getOrgId(): Promise<string | null> {
    const session = await auth()
    if (!session?.user) return null
    return (session.user as any).organizationId || null
}

export async function getPaymentMethods(): Promise<{ error?: string; data?: PaymentMethodEntry[] }> {
    const orgId = await getOrgId()
    if (!orgId) return { error: "Not authenticated" }

    try {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { paymentMethods: true }
        })

        const methods = (org?.paymentMethods as PaymentMethodEntry[] | null) || []
        return { data: methods }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function addPaymentMethod(data: Omit<PaymentMethodEntry, 'id' | 'isDefault'>): Promise<{ error?: string; success?: boolean }> {
    const orgId = await getOrgId()
    if (!orgId) return { error: "Not authenticated" }

    const result = addPaymentMethodSchema.safeParse(data)
    if (!result.success) return { error: "Invalid input data" }
    const parsedData = result.data

    try {
        const client = await clientPromise
        const db = client.db("propx")

        const org = await db.collection("Organization").findOne({ _id: new ObjectId(orgId) })
        const existing: PaymentMethodEntry[] = (org?.paymentMethods as PaymentMethodEntry[] | null) || []

        const newMethod: PaymentMethodEntry = {
            ...parsedData,
            id: new ObjectId().toHexString(),
            isDefault: existing.length === 0, // first method is auto-default
        }

        const updated = [...existing, newMethod]

        // If this is the first method and it's default, also sync legacy fields
        const legacyUpdate: Record<string, any> = {
            paymentMethods: updated,
            updatedAt: new Date(),
        }

        if (newMethod.isDefault) {
            if (newMethod.type === 'UPI') {
                legacyUpdate.upiId = newMethod.upiId || null
            } else {
                legacyUpdate.bankName = newMethod.bankName || null
                legacyUpdate.accountNumber = newMethod.accountNumber || null
                legacyUpdate.ifscCode = newMethod.ifscCode || null
                legacyUpdate.accountHolder = newMethod.accountHolder || null
            }
        }

        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            { $set: legacyUpdate }
        )

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function removePaymentMethod(methodId: string): Promise<{ error?: string; success?: boolean }> {
    const orgId = await getOrgId()
    if (!orgId) return { error: "Not authenticated" }

    try {
        const client = await clientPromise
        const db = client.db("propx")

        const org = await db.collection("Organization").findOne({ _id: new ObjectId(orgId) })
        const existing: PaymentMethodEntry[] = (org?.paymentMethods as PaymentMethodEntry[] | null) || []

        const removed = existing.find(m => m.id === methodId)
        const filtered = existing.filter(m => m.id !== methodId)

        // If we removed the default, set the first remaining as default
        if (removed?.isDefault && filtered.length > 0) {
            filtered[0].isDefault = true
        }

        const legacyUpdate: Record<string, any> = {
            paymentMethods: filtered,
            updatedAt: new Date(),
        }

        // Sync legacy fields to new default
        const newDefault = filtered.find(m => m.isDefault)
        if (newDefault) {
            if (newDefault.type === 'UPI') {
                legacyUpdate.upiId = newDefault.upiId || null
            } else {
                legacyUpdate.bankName = newDefault.bankName || null
                legacyUpdate.accountNumber = newDefault.accountNumber || null
                legacyUpdate.ifscCode = newDefault.ifscCode || null
                legacyUpdate.accountHolder = newDefault.accountHolder || null
            }
        } else {
            // No methods left, clear legacy fields
            legacyUpdate.upiId = null
            legacyUpdate.bankName = null
            legacyUpdate.accountNumber = null
            legacyUpdate.ifscCode = null
            legacyUpdate.accountHolder = null
        }

        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            { $set: legacyUpdate }
        )

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function setDefaultPaymentMethod(methodId: string): Promise<{ error?: string; success?: boolean }> {
    const orgId = await getOrgId()
    if (!orgId) return { error: "Not authenticated" }

    try {
        const client = await clientPromise
        const db = client.db("propx")

        const org = await db.collection("Organization").findOne({ _id: new ObjectId(orgId) })
        const existing: PaymentMethodEntry[] = (org?.paymentMethods as PaymentMethodEntry[] | null) || []

        const updated = existing.map(m => ({
            ...m,
            isDefault: m.id === methodId,
        }))

        const newDefault = updated.find(m => m.isDefault)

        const legacyUpdate: Record<string, any> = {
            paymentMethods: updated,
            updatedAt: new Date(),
        }

        // Sync legacy fields from new default
        if (newDefault) {
            if (newDefault.type === 'UPI') {
                legacyUpdate.upiId = newDefault.upiId || null
                // Don't clear bank fields — they represent the bank method separately
            } else {
                legacyUpdate.bankName = newDefault.bankName || null
                legacyUpdate.accountNumber = newDefault.accountNumber || null
                legacyUpdate.ifscCode = newDefault.ifscCode || null
                legacyUpdate.accountHolder = newDefault.accountHolder || null
            }
        }

        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            { $set: legacyUpdate }
        )

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updatePaymentInstructions(instructions: string): Promise<{ error?: string; success?: boolean }> {
    const orgId = await getOrgId()
    if (!orgId) return { error: "Not authenticated" }

    try {
        const client = await clientPromise
        const db = client.db("propx")

        await db.collection("Organization").updateOne(
            { _id: new ObjectId(orgId) },
            {
                $set: {
                    paymentInstructions: instructions || null,
                    updatedAt: new Date(),
                }
            }
        )

        revalidatePath('/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
