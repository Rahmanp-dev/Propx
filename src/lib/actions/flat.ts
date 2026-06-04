'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
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

const createFlatSchema = z.object({
    buildingId: z.string(),
    floorId: z.string(),
    flatNumber: z.string().min(1),
    flatType: z.enum(["STUDIO", "BHK1", "BHK2", "BHK3", "OTHER"]).default("BHK1"),
    rentAmount: z.coerce.number().min(0),
    maintenanceAmount: z.coerce.number().min(0),
    depositAmount: z.coerce.number().min(0).optional()
})

export type CreateFlatInput = z.infer<typeof createFlatSchema>

export async function createFlat(data: CreateFlatInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = createFlatSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { buildingId, floorId, flatNumber, flatType, rentAmount, maintenanceAmount, depositAmount } = result.data

    try {
        // Verify building belongs to user's org
        if (!orgCtx.isSuperAdmin) {
            const building = await prisma.building.findFirst({
                where: { id: buildingId, organizationId: orgCtx.organizationId! }
            })
            if (!building) return { error: "Building not found" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const flatDoc = {
            buildingId: new ObjectId(buildingId),
            floorId: new ObjectId(floorId),
            flatNumber,
            flatType,
            rentAmount,
            maintenanceAmount,
            depositAmount: depositAmount || rentAmount * 2,
            electricityType: "METERED",
            status: "VACANT",
            createdAt: now,
            updatedAt: now
        }

        await db.collection("Flat").insertOne(flatDoc)

        // Update Building totalFlats count
        await db.collection("Building").updateOne(
            { _id: new ObjectId(buildingId) },
            { $inc: { totalFlats: 1 }, $set: { updatedAt: now } }
        )

        // Update Floor flatsCount
        await db.collection("Floor").updateOne(
            { _id: new ObjectId(floorId) },
            { $inc: { flatsCount: 1 } }
        )

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create flat:", error)
        return { error: `Failed to create flat: ${error.message || String(error)}` }
    }
}

export async function deleteFlat(flatId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const flat = await prisma.flat.findFirst({
            where: { id: flatId, building: orgCtx.isSuperAdmin ? undefined : { organizationId: orgCtx.organizationId! } },
            include: { building: true, tenants: true }
        })

        if (!flat) return { error: "Flat not found" }

        const client = await clientPromise
        const db = client.db("propx")

        const flatObjectId = new ObjectId(flatId)
        
        // 1. Delete Payments, Meter Readings, Maintenance Requests
        await db.collection("Payment").deleteMany({ flatId: flatObjectId })
        await db.collection("MeterReading").deleteMany({ flatId: flatObjectId })
        await db.collection("MaintenanceRequest").deleteMany({ flatId: flatObjectId })

        // 2. Delete Tenants and their WhatsAppLogs
        const tenantIds = flat.tenants.map(t => new ObjectId(t.id))
        if (tenantIds.length > 0) {
            await db.collection("WhatsAppLog").deleteMany({ tenantId: { $in: tenantIds } })
            await db.collection("Tenant").deleteMany({ _id: { $in: tenantIds } })
        }

        // 3. Delete Flat
        await db.collection("Flat").deleteOne({ _id: flatObjectId })

        // 4. Decrement Building and Floor counts
        await db.collection("Building").updateOne(
            { _id: new ObjectId(flat.buildingId) },
            { $inc: { totalFlats: -1 } }
        )
        await db.collection("Floor").updateOne(
            { _id: new ObjectId(flat.floorId) },
            { $inc: { flatsCount: -1 } }
        )

        revalidatePath('/', 'layout')
        
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete flat:", error)
        return { error: `Failed to delete flat: ${error.message || String(error)}` }
    }
}
