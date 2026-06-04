'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { sendPushToOrganization } from "./push"

// ==========================================
// ORG CONTEXT HELPER
// ==========================================

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

// ==========================================
// SCHEMAS
// ==========================================

const createInquirySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().min(1, "Phone is required").max(20),
    email: z.string().email().optional().or(z.literal("")),
    flatType: z.string().optional(),
    budget: z.coerce.number().min(0).optional(),
    message: z.string().optional(),
    source: z.enum(["WHATSAPP", "WEBSITE", "WALK_IN", "REFERRAL", "PHONE"]).default("PHONE"),
    buildingId: z.string().optional(),
    notes: z.string().optional(),
})

export type CreateInquiryInput = z.infer<typeof createInquirySchema>

const VALID_INQUIRY_STATUSES = ["NEW", "CONTACTED", "VIEWING_SCHEDULED", "CONVERTED", "REJECTED"]

// ==========================================
// QUERIES
// ==========================================

export async function getInquiries(status?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where: Record<string, unknown> = {}
        if (status && VALID_INQUIRY_STATUSES.includes(status)) {
            where.status = status
        }

        // Scope by org through building
        if (!orgCtx.isSuperAdmin) {
            where.building = { organizationId: orgCtx.organizationId! }
        }

        const inquiries = await prisma.tenantInquiry.findMany({
            where,
            include: {
                building: {
                    select: {
                        name: true,
                        address: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        return { success: true, data: inquiries }
    } catch (error: any) {
        console.error("Failed to fetch inquiries:", error)
        return { error: `Failed to fetch inquiries: ${error.message || String(error)}` }
    }
}

export async function getInquiryStats() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // For org-scoped stats, we need to use findMany + manual counting
        // since groupBy doesn't easily support nested relation filters
        const buildingFilter = orgCtx.isSuperAdmin
            ? {}
            : { building: { organizationId: orgCtx.organizationId! } }

        const statusCounts = await prisma.tenantInquiry.groupBy({
            by: ['status'],
            _count: true,
            where: buildingFilter,
        })

        const stats: Record<string, number> = {
            NEW: 0,
            CONTACTED: 0,
            VIEWING_SCHEDULED: 0,
            CONVERTED: 0,
            REJECTED: 0,
        }
        statusCounts.forEach(s => {
            stats[s.status] = s._count
        })

        return { success: true, data: stats }
    } catch (error: any) {
        console.error("Failed to fetch inquiry stats:", error)
        return { error: `Failed to fetch inquiry stats: ${error.message || String(error)}` }
    }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createInquiry(data: CreateInquiryInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = createInquirySchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.issues.map((e: { message: string }) => e.message).join(", ") }
    }

    const { name, phone, email, flatType, budget, message, source, buildingId, notes } = result.data

    try {
        // Verify building belongs to org if specified
        if (buildingId && !orgCtx.isSuperAdmin) {
            const building = await prisma.building.findFirst({
                where: { id: buildingId, organizationId: orgCtx.organizationId! }
            })
            if (!building) return { error: "Building not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const doc = {
            name,
            phone,
            email: email || null,
            flatType: flatType || null,
            budget: budget || null,
            message: message || null,
            source,
            status: "NEW",
            buildingId: buildingId ? new ObjectId(buildingId) : null,
            notes: notes || null,
            createdAt: now,
            updatedAt: now,
        }

        const insertResult = await db.collection("TenantInquiry").insertOne(doc)

        if (orgCtx.organizationId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(orgCtx.organizationId),
                type: "INQUIRY_NEW",
                title: "New Lead Inquiry",
                message: `New inquiry from ${name} via ${source}`,
                isRead: false,
                data: JSON.stringify({ inquiryId: insertResult.insertedId.toString(), phone, email }),
                createdAt: now,
            })

            // Fire and forget push notification
            sendPushToOrganization(orgCtx.organizationId, {
                title: "New Lead Inquiry",
                message: `New inquiry from ${name} via ${source}`,
                url: `/inquiries`
            }).catch(console.error)
        }

        revalidatePath('/', 'layout')

        return { success: true, data: { id: insertResult.insertedId.toString() } }
    } catch (error: any) {
        console.error("Failed to create inquiry:", error)
        return { error: `Failed to create inquiry: ${error.message || String(error)}` }
    }
}

export async function updateInquiryStatus(id: string, status: string, notes?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        if (!VALID_INQUIRY_STATUSES.includes(status)) {
            return { error: `Invalid status: ${status}. Must be one of: ${VALID_INQUIRY_STATUSES.join(", ")}` }
        }

        const existing = await prisma.tenantInquiry.findUnique({
            where: { id },
            include: { building: { select: { organizationId: true } } }
        })

        if (!existing) {
            return { error: "Inquiry not found" }
        }

        // Verify org ownership through building
        if (!orgCtx.isSuperAdmin && existing.building?.organizationId !== orgCtx.organizationId) {
            return { error: "Inquiry not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const updateFields: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
        }

        if (notes) {
            updateFields.notes = existing.notes
                ? `${existing.notes}\n${notes}`
                : notes
        }

        await db.collection("TenantInquiry").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        )

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to update inquiry status:", error)
        return { error: `Failed to update inquiry status: ${error.message || String(error)}` }
    }
}
