'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"
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

export async function createBuilding(data: CreateBuildingInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }
    if (!orgCtx.organizationId && !orgCtx.isSuperAdmin) {
        return { error: "No organization associated with this account" }
    }

    const result = createBuildingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { name, address, totalFloors, defaultRentBHK1, defaultRentBHK2, defaultRentBHK3, ratePerUnit } = result.data

    try {
        const client = await clientPromise
        const db = client.db("propx")
        const { ObjectId } = await import('mongodb')

        const now = new Date()
        const buildingDoc: Record<string, any> = {
            name,
            address,
            totalFloors,
            totalFlats: 0,
            occupancyRate: 0.0,
            ratePerUnit: ratePerUnit ?? 10,
            defaultRentBHK1: defaultRentBHK1 ?? 8000,
            defaultRentBHK2: defaultRentBHK2 ?? 12000,
            defaultRentBHK3: defaultRentBHK3 ?? 16000,
            createdAt: now,
            updatedAt: now
        }

        // Add organizationId for the building
        if (orgCtx.organizationId) {
            buildingDoc.organizationId = new ObjectId(orgCtx.organizationId)
        }

        const insertResult = await db.collection("Building").insertOne(buildingDoc)
        const buildingId = insertResult.insertedId.toString()

        // Auto-generate floors
        const floorsData = Array.from({ length: totalFloors }).map((_, i) => ({
            buildingId: insertResult.insertedId,
            number: i,
            flatsCount: 0,
        }))

        if (floorsData.length > 0) {
            await db.collection("Floor").insertMany(floorsData)
        }

        revalidatePath('/dashboard')
        revalidatePath('/buildings')
        revalidatePath('/')
        return { success: true, data: { ...buildingDoc, id: buildingId } }
    } catch (error: any) {
        console.error("Failed to create building:", error)
        return { error: `Failed to create building: ${error.message || String(error)}` }
    }
}

export async function getBuildings() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Scope by organization (super admin sees all)
        const where = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        const buildings = await prisma.building.findMany({
            where,
            include: {
                floors: true,
                flats: {
                    include: {
                        payments: {
                            where: {
                                month: {
                                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: buildings }
    } catch (error: any) {
        console.error("Failed to fetch buildings:", error)
        return { error: `Failed to fetch buildings: ${error.message || String(error)}` }
    }
}
