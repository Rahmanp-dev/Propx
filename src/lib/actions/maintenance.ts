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

const createMaintenanceSchema = z.object({
    flatId: z.string().min(1, "Flat is required"),
    buildingId: z.string().min(1, "Building is required"),
    tenantId: z.string().optional(),
    category: z.enum(["PLUMBING", "ELECTRICAL", "CARPENTRY", "PAINTING", "CLEANING", "PEST_CONTROL", "OTHER"]),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    images: z.array(z.string()).optional(),
})

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    OPEN: ["ASSIGNED", "IN_PROGRESS", "CLOSED"],
    ASSIGNED: ["IN_PROGRESS", "CLOSED"],
    IN_PROGRESS: ["RESOLVED", "CLOSED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
}

// ==========================================
// QUERIES
// ==========================================

export async function getMaintenanceRequests(buildingId?: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where: Record<string, unknown> = {}
        if (buildingId) {
            where.buildingId = buildingId
        }

        // Scope by org through building
        if (!orgCtx.isSuperAdmin) {
            where.building = { organizationId: orgCtx.organizationId! }
        }

        const requests = await prisma.maintenanceRequest.findMany({
            where,
            include: {
                flat: {
                    select: {
                        flatNumber: true,
                        flatType: true,
                    }
                },
                tenant: {
                    select: {
                        fullName: true,
                        phone: true,
                    }
                },
                building: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: [
                { createdAt: 'desc' },
            ],
        })

        return { success: true, data: requests }
    } catch (error: any) {
        console.error("Failed to fetch maintenance requests:", error)
        return { error: `Failed to fetch maintenance requests: ${error.message || String(error)}` }
    }
}

export async function getMaintenanceStats() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const orgFilter = orgCtx.isSuperAdmin
            ? {}
            : { building: { organizationId: orgCtx.organizationId! } }

        const [openCount, inProgressCount, resolvedThisMonth, totalResolved] = await Promise.all([
            prisma.maintenanceRequest.count({ where: { status: "OPEN", ...orgFilter } }),
            prisma.maintenanceRequest.count({ where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] }, ...orgFilter } }),
            prisma.maintenanceRequest.count({
                where: {
                    status: { in: ["RESOLVED", "CLOSED"] },
                    resolvedAt: { gte: startOfMonth },
                    ...orgFilter,
                }
            }),
            prisma.maintenanceRequest.findMany({
                where: {
                    resolvedAt: { not: null },
                    ...orgFilter,
                },
                select: {
                    createdAt: true,
                    resolvedAt: true,
                },
            }),
        ])

        // Calculate average resolution time in days
        let avgResolutionDays = 0
        if (totalResolved.length > 0) {
            const totalDays = totalResolved.reduce((sum, r) => {
                if (!r.resolvedAt) return sum
                const diff = r.resolvedAt.getTime() - r.createdAt.getTime()
                return sum + diff / (1000 * 60 * 60 * 24)
            }, 0)
            avgResolutionDays = Math.round((totalDays / totalResolved.length) * 10) / 10
        }

        return {
            success: true,
            data: {
                open: openCount,
                inProgress: inProgressCount,
                resolvedThisMonth,
                avgResolutionDays,
            }
        }
    } catch (error: any) {
        console.error("Failed to fetch maintenance stats:", error)
        return { error: `Failed to fetch maintenance stats: ${error.message || String(error)}` }
    }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createMaintenanceRequest(data: CreateMaintenanceInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = createMaintenanceSchema.safeParse(data)

    if (!result.success) {
        return { error: result.error.issues.map((e: { message: string }) => e.message).join(", ") }
    }

    const { flatId, buildingId, tenantId, category, title, description, priority, images } = result.data

    try {
        // Verify the flat exists and belongs to the building (and building belongs to org)
        const flatWhere: Record<string, any> = { id: flatId, buildingId }
        if (!orgCtx.isSuperAdmin) {
            flatWhere.building = { organizationId: orgCtx.organizationId! }
        }

        const flat = await prisma.flat.findFirst({ where: flatWhere })

        if (!flat) {
            return { error: "Flat not found or does not belong to the specified building" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const doc = {
            flatId: new ObjectId(flatId),
            buildingId: new ObjectId(buildingId),
            tenantId: tenantId ? new ObjectId(tenantId) : null,
            category,
            title,
            description,
            priority,
            status: "OPEN",
            images: images || [],
            assignedTo: null,
            resolvedAt: null,
            cost: null,
            notes: null,
            createdAt: now,
            updatedAt: now,
        }

        const insertResult = await db.collection("MaintenanceRequest").insertOne(doc)

        // Create notification for the organization
        if (orgCtx.organizationId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(orgCtx.organizationId),
                type: "MAINTENANCE_NEW",
                title: "New Maintenance Request",
                message: `New ${priority} priority request for Flat ${flat.flatNumber}: ${title}`,
                isRead: false,
                data: JSON.stringify({ requestId: insertResult.insertedId.toString(), flatId }),
                createdAt: now,
            })
            
            // Fire and forget push notification
            sendPushToOrganization(orgCtx.organizationId, {
                title: "New Maintenance Request",
                message: `New ${priority} priority request for Flat ${flat.flatNumber}: ${title}`,
                url: `/maintenance`
            }).catch(console.error)
        }

        revalidatePath('/dashboard')
        revalidatePath('/maintenance')
        revalidatePath(`/buildings/${buildingId}`)

        return { success: true, data: { id: insertResult.insertedId.toString() } }
    } catch (error: any) {
        console.error("Failed to create maintenance request:", error)
        return { error: `Failed to create maintenance request: ${error.message || String(error)}` }
    }
}

export async function updateMaintenanceStatus(
    id: string,
    status: string,
    notes?: string,
    cost?: number
) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Get current request to validate status transition
        const current = await prisma.maintenanceRequest.findUnique({
            where: { id },
            include: { 
                building: { select: { organizationId: true } },
                flat: { select: { flatNumber: true } }
            }
        })

        if (!current) {
            return { error: "Maintenance request not found" }
        }

        // Verify org ownership
        if (!orgCtx.isSuperAdmin && current.building.organizationId !== orgCtx.organizationId) {
            return { error: "Maintenance request not found" }
        }

        const allowedTransitions = VALID_STATUS_TRANSITIONS[current.status]
        if (!allowedTransitions || !allowedTransitions.includes(status)) {
            return { error: `Cannot transition from ${current.status} to ${status}` }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const updateFields: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
        }

        if (notes) {
            updateFields.notes = current.notes
                ? `${current.notes}\n${notes}`
                : notes
        }

        if (cost !== undefined && cost !== null) {
            updateFields.cost = cost
        }

        if (status === "RESOLVED") {
            updateFields.resolvedAt = new Date()
            
            if (current.building.organizationId) {
                await db.collection("Notification").insertOne({
                    organizationId: new ObjectId(current.building.organizationId),
                    type: "MAINTENANCE_RESOLVED",
                    title: "Maintenance Request Resolved",
                    message: `Maintenance request for Flat ${current.flat?.flatNumber || 'Unknown'} has been resolved.`,
                    isRead: false,
                    data: JSON.stringify({ requestId: id }),
                    createdAt: new Date(),
                })
                
                // Fire and forget push notification
                sendPushToOrganization(current.building.organizationId, {
                    title: "Maintenance Request Resolved",
                    message: `Maintenance request for Flat ${current.flat?.flatNumber || 'Unknown'} has been resolved.`,
                    url: `/maintenance`
                }).catch(console.error)
            }
        }

        await db.collection("MaintenanceRequest").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        )

        revalidatePath('/dashboard')
        revalidatePath('/maintenance')
        revalidatePath(`/buildings/${current.buildingId}`)

        return { success: true }
    } catch (error: any) {
        console.error("Failed to update maintenance status:", error)
        return { error: `Failed to update maintenance status: ${error.message || String(error)}` }
    }
}
