'use server'

import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

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

const updateBuildingSchema = z.object({
    buildingId: z.string(),
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    ratePerUnit: z.coerce.number().min(0),
    totalFloors: z.coerce.number().min(1).optional(),
    defaultRentBHK1: z.coerce.number().min(0).optional(),
    defaultRentBHK2: z.coerce.number().min(0).optional(),
    defaultRentBHK3: z.coerce.number().min(0).optional(),
    discoverEnabled: z.boolean().optional(),
    discoverBio: z.string().optional().nullable(),
    contactWhatsApp: z.string().optional().nullable(),
    amenities: z.array(z.string()).optional(),
})

export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>

export async function updateBuildingSettings(data: UpdateBuildingInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = updateBuildingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { 
        buildingId, name, address, latitude, longitude, ratePerUnit, 
        totalFloors, defaultRentBHK1, defaultRentBHK2, defaultRentBHK3,
        discoverEnabled, discoverBio, contactWhatsApp, amenities
    } = result.data

    try {
        const client = await clientPromise
        const db = client.db("propx")
        const bId = new ObjectId(buildingId)

        const building = await db.collection("Building").findOne({ _id: bId })
        if (!building) return { error: "Building not found" }

        // Verify building belongs to user's org
        if (!orgCtx.isSuperAdmin && building.organizationId?.toString() !== orgCtx.organizationId) {
            return { error: "Building not found" }
        }

        const currentFloors = building.totalFloors || 0

        // Handle Floor Updates if provided
        if (totalFloors !== undefined && totalFloors !== currentFloors) {
            if (totalFloors > currentFloors) {
                const newFloorsData = Array.from({ length: totalFloors - currentFloors }).map((_, i) => ({
                    buildingId: bId,
                    number: currentFloors + i,
                    flatsCount: 0
                }))

                if (newFloorsData.length > 0) {
                    await db.collection("Floor").insertMany(newFloorsData)
                }
            } else {
                const floorsToDelete = await db.collection("Floor").find({
                    buildingId: bId,
                    number: { $gte: totalFloors }
                }).toArray()

                for (const floor of floorsToDelete) {
                    const flatCount = await db.collection("Flat").countDocuments({ floorId: floor._id })
                    if (flatCount > 0) {
                        return { error: `Cannot delete Floor ${floor.number} because it has flats.` }
                    }
                }

                await db.collection("Floor").deleteMany({
                    buildingId: bId,
                    number: { $gte: totalFloors }
                })
            }
        }

        const updateFields: Record<string, any> = {
            ratePerUnit,
            totalFloors: totalFloors ?? currentFloors,
            updatedAt: new Date()
        }

        if (name !== undefined) updateFields.name = name
        if (address !== undefined) updateFields.address = address
        if (latitude !== undefined) updateFields.latitude = latitude
        if (longitude !== undefined) updateFields.longitude = longitude
        if (defaultRentBHK1 !== undefined) updateFields.defaultRentBHK1 = defaultRentBHK1
        if (defaultRentBHK2 !== undefined) updateFields.defaultRentBHK2 = defaultRentBHK2
        if (defaultRentBHK3 !== undefined) updateFields.defaultRentBHK3 = defaultRentBHK3
        if (discoverEnabled !== undefined) updateFields.discoverEnabled = discoverEnabled
        if (discoverBio !== undefined) updateFields.discoverBio = discoverBio
        if (contactWhatsApp !== undefined) updateFields.contactWhatsApp = contactWhatsApp
        if (amenities !== undefined) updateFields.amenities = amenities

        await db.collection("Building").updateOne(
            { _id: bId },
            { $set: updateFields }
        )

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to update building:", error)
        return { error: `Failed to update building: ${error instanceof Error ? error.message : String(error)}` }
    }
}
