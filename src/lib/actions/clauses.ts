'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

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

const CLAUSE_CATEGORIES = [
    "OCCUPANCY", "ELECTRICITY", "LOCK_IN", "STRUCTURAL", "PETS",
    "NOISE", "GUESTS", "PARKING", "WASTE", "POLICE_VERIFICATION", "CUSTOM"
] as const

const CLAUSE_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const

const createClauseSchema = z.object({
    buildingId: z.string().min(1),
    category: z.enum(CLAUSE_CATEGORIES).default("CUSTOM"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    severity: z.enum(CLAUSE_SEVERITIES).default("MEDIUM"),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().min(0).default(0),
})

export type CreateClauseInput = z.infer<typeof createClauseSchema>

const updateClauseSchema = z.object({
    clauseId: z.string().min(1),
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    category: z.enum(CLAUSE_CATEGORIES).optional(),
    severity: z.enum(CLAUSE_SEVERITIES).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().min(0).optional(),
})

export type UpdateClauseInput = z.infer<typeof updateClauseSchema>

// ==========================================
// PRE-BUILT CLAUSE TEMPLATES
// ==========================================

export const CLAUSE_TEMPLATES = [
    {
        category: "OCCUPANCY" as const,
        title: "Residential Use Only",
        description: "The premises shall be used exclusively for residential purposes. No commercial, industrial, or subletting activities are permitted without prior written consent from the owner.",
        severity: "CRITICAL" as const,
    },
    {
        category: "ELECTRICITY" as const,
        title: "Electricity Meter Policy",
        description: "Tenant is responsible for all electricity charges based on metered readings. Meter tampering, bypassing, or unauthorized load increases are strictly prohibited and may be punishable under the Electricity Act 2003.",
        severity: "CRITICAL" as const,
    },
    {
        category: "POLICE_VERIFICATION" as const,
        title: "Mandatory Police Verification",
        description: "Tenant must complete police verification within 7 days of move-in. Non-compliance constitutes grounds for termination of the lease agreement.",
        severity: "CRITICAL" as const,
    },
    {
        category: "LOCK_IN" as const,
        title: "Lock-in Period",
        description: "Minimum stay period of 6 months from the date of move-in. Early termination requires 2 months' rent as compensation or as mutually agreed.",
        severity: "HIGH" as const,
    },
    {
        category: "STRUCTURAL" as const,
        title: "No Structural Modifications",
        description: "No drilling, painting, structural alterations, or fixture installations without prior written consent from the owner. Any unauthorized modifications will be restored at the tenant's expense upon vacating.",
        severity: "HIGH" as const,
    },
    {
        category: "PETS" as const,
        title: "No Pets Policy",
        description: "No pets of any kind are allowed on the premises without prior written approval from the owner and an additional security deposit as agreed.",
        severity: "MEDIUM" as const,
    },
    {
        category: "NOISE" as const,
        title: "Quiet Hours & Noise Policy",
        description: "Quiet hours: 10:00 PM – 7:00 AM. No loud music, parties, or activities that disturb other tenants or neighbors during these hours.",
        severity: "MEDIUM" as const,
    },
    {
        category: "GUESTS" as const,
        title: "Guest & Visitor Policy",
        description: "Overnight guests limited to 5 days per month. Long-term guests (more than 7 consecutive days) require prior notification to the owner.",
        severity: "MEDIUM" as const,
    },
    {
        category: "PARKING" as const,
        title: "Vehicle & Parking Rules",
        description: "One designated parking slot per flat. No unauthorized vehicle storage in common areas. Two-wheeler parking as per building rules.",
        severity: "LOW" as const,
    },
    {
        category: "WASTE" as const,
        title: "Waste Disposal & Hygiene",
        description: "Tenant must segregate waste (wet/dry) and follow building waste disposal schedules. No disposal of waste in common areas, corridors, or stairways.",
        severity: "LOW" as const,
    },
]

// ==========================================
// QUERIES
// ==========================================

export async function getBuildingClauses(buildingId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Verify building belongs to org
        const building = await prisma.building.findFirst({
            where: {
                id: buildingId,
                ...(orgCtx.isSuperAdmin ? {} : { organizationId: orgCtx.organizationId! }),
            },
        })
        if (!building) return { error: "Building not found" }

        const clauses = await prisma.buildingClause.findMany({
            where: { buildingId },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        })

        return { success: true, data: clauses }
    } catch (error: any) {
        console.error("Failed to fetch building clauses:", error)
        return { error: `Failed to fetch building clauses: ${error.message || String(error)}` }
    }
}

// Public query — no auth required, only returns active clauses
export async function getPublicBuildingClauses(buildingId: string) {
    try {
        const clauses = await prisma.buildingClause.findMany({
            where: { buildingId, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                category: true,
                title: true,
                description: true,
                severity: true,
                sortOrder: true,
            },
        })
        return { success: true, data: clauses }
    } catch (error: any) {
        console.error("Failed to fetch public clauses:", error)
        return { error: `Failed to fetch clauses: ${error.message || String(error)}` }
    }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createClause(data: CreateClauseInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = createClauseSchema.safeParse(data)
    if (!result.success) {
        return { error: result.error.issues.map(e => e.message).join(", ") }
    }

    const { buildingId, category, title, description, severity, isActive, sortOrder } = result.data

    try {
        // Verify building belongs to org
        const building = await prisma.building.findFirst({
            where: {
                id: buildingId,
                ...(orgCtx.isSuperAdmin ? {} : { organizationId: orgCtx.organizationId! }),
            },
        })
        if (!building) return { error: "Building not found" }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const doc = {
            buildingId: new ObjectId(buildingId),
            category,
            title,
            description,
            severity,
            isActive,
            sortOrder,
            createdAt: now,
            updatedAt: now,
        }

        const insertResult = await db.collection("BuildingClause").insertOne(doc)

        revalidatePath('/', 'layout')
        return { success: true, data: { id: insertResult.insertedId.toString() } }
    } catch (error: any) {
        console.error("Failed to create clause:", error)
        return { error: `Failed to create clause: ${error.message || String(error)}` }
    }
}

export async function updateClause(data: UpdateClauseInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = updateClauseSchema.safeParse(data)
    if (!result.success) {
        return { error: result.error.issues.map(e => e.message).join(", ") }
    }

    const { clauseId, ...updates } = result.data

    try {
        // Verify clause's building belongs to org
        const clause = await prisma.buildingClause.findUnique({
            where: { id: clauseId },
            include: { building: { select: { organizationId: true } } },
        })
        if (!clause) return { error: "Clause not found" }
        if (!orgCtx.isSuperAdmin && clause.building.organizationId !== orgCtx.organizationId) {
            return { error: "Clause not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const updateFields: Record<string, unknown> = { updatedAt: new Date() }
        if (updates.title !== undefined) updateFields.title = updates.title
        if (updates.description !== undefined) updateFields.description = updates.description
        if (updates.category !== undefined) updateFields.category = updates.category
        if (updates.severity !== undefined) updateFields.severity = updates.severity
        if (updates.isActive !== undefined) updateFields.isActive = updates.isActive
        if (updates.sortOrder !== undefined) updateFields.sortOrder = updates.sortOrder

        await db.collection("BuildingClause").updateOne(
            { _id: new ObjectId(clauseId) },
            { $set: updateFields }
        )

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update clause:", error)
        return { error: `Failed to update clause: ${error.message || String(error)}` }
    }
}

export async function deleteClause(clauseId: string) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    try {
        const clause = await prisma.buildingClause.findUnique({
            where: { id: clauseId },
            include: { building: { select: { organizationId: true } } },
        })
        if (!clause) return { error: "Clause not found" }
        if (!orgCtx.isSuperAdmin && clause.building.organizationId !== orgCtx.organizationId) {
            return { error: "Clause not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        // Delete acknowledgments first
        await db.collection("ClauseAcknowledgment").deleteMany({ clauseId: new ObjectId(clauseId) })
        // Delete clause
        await db.collection("BuildingClause").deleteOne({ _id: new ObjectId(clauseId) })

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete clause:", error)
        return { error: `Failed to delete clause: ${error.message || String(error)}` }
    }
}

export async function addTemplateClausesToBuilding(buildingId: string) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    try {
        const building = await prisma.building.findFirst({
            where: {
                id: buildingId,
                ...(orgCtx.isSuperAdmin ? {} : { organizationId: orgCtx.organizationId! }),
            },
        })
        if (!building) return { error: "Building not found" }

        // Check if building already has clauses
        const existingCount = await prisma.buildingClause.count({
            where: { buildingId },
        })
        if (existingCount > 0) {
            return { error: "Building already has clauses. Delete existing clauses first or add templates individually." }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const docs = CLAUSE_TEMPLATES.map((t, i) => ({
            buildingId: new ObjectId(buildingId),
            category: t.category,
            title: t.title,
            description: t.description,
            severity: t.severity,
            isActive: true,
            sortOrder: i,
            createdAt: now,
            updatedAt: now,
        }))

        await db.collection("BuildingClause").insertMany(docs)

        revalidatePath('/', 'layout')
        return { success: true, data: { count: docs.length } }
    } catch (error: any) {
        console.error("Failed to add template clauses:", error)
        return { error: `Failed to add template clauses: ${error.message || String(error)}` }
    }
}
