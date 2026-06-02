'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

export async function deleteBuilding(buildingId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const building = await prisma.building.findFirst({
            where: { id: buildingId, ...(orgCtx.isSuperAdmin ? {} : { organizationId: orgCtx.organizationId! }) },
            include: { flats: true, floors: true }
        })

        if (!building) return { error: "Building not found" }

        const flatIds = building.flats.map(f => new ObjectId(f.id))
        const floorIds = building.floors.map(f => new ObjectId(f.id))
        
        const client = await clientPromise
        const db = client.db("propx")

        // 1. Delete Payments and Meter Readings for these flats
        if (flatIds.length > 0) {
            await db.collection("Payment").deleteMany({ flatId: { $in: flatIds } })
            await db.collection("MeterReading").deleteMany({ flatId: { $in: flatIds } })
            await db.collection("MaintenanceRequest").deleteMany({ flatId: { $in: flatIds } })
            
            // Tenants associated with flats
            const tenants = await db.collection("Tenant").find({ assignedFlatId: { $in: flatIds } }).toArray()
            const tenantIds = tenants.map(t => t._id)
            if (tenantIds.length > 0) {
                await db.collection("WhatsAppLog").deleteMany({ tenantId: { $in: tenantIds } })
                await db.collection("Tenant").deleteMany({ _id: { $in: tenantIds } })
            }
            
            await db.collection("Flat").deleteMany({ _id: { $in: flatIds } })
        }

        // 2. Delete Floors
        if (floorIds.length > 0) {
            await db.collection("Floor").deleteMany({ _id: { $in: floorIds } })
        }

        // 3. Delete Inquiries for this building
        await db.collection("TenantInquiry").deleteMany({ buildingId: new ObjectId(buildingId) })

        // 4. Delete Building
        await db.collection("Building").deleteOne({ _id: new ObjectId(buildingId) })

        revalidatePath('/dashboard')
        revalidatePath('/buildings')
        
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete building:", error)
        return { error: `Failed to delete building: ${error.message || String(error)}` }
    }
}
