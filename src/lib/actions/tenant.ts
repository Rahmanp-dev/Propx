'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { onboardTenantSchema, OnboardTenantInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"
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

export async function onboardTenant(data: OnboardTenantInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = onboardTenantSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { flatId, fullName, phone, aadhaarNumber, occupantsCount, leaseStartDate, leaseEndDate, rentAmount, depositAmount, initialMeterReading, paymentMethodId } = result.data

    try {
        const client = await clientPromise
        const db = client.db("propx")

        // 0. Record Initial Meter Reading if provided
        if (initialMeterReading !== undefined && initialMeterReading !== null) {
            const readingDate = new Date(leaseStartDate)
            const rMonth = readingDate.getMonth()
            const rYear = readingDate.getFullYear()

            await db.collection("MeterReading").updateOne(
                {
                    flatId: new ObjectId(flatId),
                    month: rMonth,
                    year: rYear
                },
                {
                    $set: {
                        reading: initialMeterReading,
                        readingDate: readingDate,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            )
        }

        if (!ObjectId.isValid(flatId)) return { error: "Invalid Flat ID" }

        // 1. Get the flat to find its building and verify org ownership
        const flat = await db.collection("Flat").findOne({ _id: new ObjectId(flatId) })
        if (!flat) return { error: "Flat not found" }

        // Verify building belongs to user's org
        if (!orgCtx.isSuperAdmin) {
            const building = await db.collection("Building").findOne({ _id: flat.buildingId })
            if (!building || building.organizationId?.toString() !== orgCtx.organizationId) {
                return { error: "Flat not found" }
            }
        }

        // 2. Native Insert Tenant
        const now = new Date()

        // Auto-generate a secure random 4-digit tenant PIN
        const tenantPin = Math.floor(1000 + Math.random() * 9000).toString()

        const tenantDoc = {
            fullName,
            phone,
            aadhaarNumber,
            occupantsCount,
            leaseStartDate,
            leaseEndDate,
            assignedFlatId: new ObjectId(flatId),
            paymentMethodId: paymentMethodId || null,
            tenantPin,
            isActive: true,
            createdAt: now,
            updatedAt: now
        }

        await db.collection("Tenant").insertOne(tenantDoc)

        // 3. Native Update Flat
        await db.collection("Flat").updateOne(
            { _id: new ObjectId(flatId) },
            {
                $set: {
                    status: "OCCUPIED",
                    rentAmount,
                    depositAmount,
                    updatedAt: now
                }
            }
        )

        revalidatePath(`/flats/${flatId}`)
        if (flat) revalidatePath(`/buildings/${flat.buildingId.toString()}`)
        revalidatePath('/dashboard')
        revalidatePath('/tenants')
        revalidatePath('/finance')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to onboard tenant:", error)
        return { error: `Failed to onboard tenant: ${error.message || String(error)}` }
    }
}

export async function offboardTenant(flatId: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const client = await clientPromise
        const db = client.db("propx")
        if (!ObjectId.isValid(flatId)) return { error: "Invalid Flat ID" }
        const fId = new ObjectId(flatId)

        // Verify flat's building belongs to org
        const flat = await db.collection("Flat").findOne({ _id: fId })
        if (!flat) return { error: "Flat not found" }

        if (!orgCtx.isSuperAdmin) {
            const building = await db.collection("Building").findOne({ _id: flat.buildingId })
            if (!building || building.organizationId?.toString() !== orgCtx.organizationId) {
                return { error: "Flat not found" }
            }
        }

        const tenant = await db.collection("Tenant").findOne({
            assignedFlatId: fId,
            isActive: true
        })

        if (!tenant) {
            return { error: "No active tenant found for this flat" }
        }

        const now = new Date()

        // Deactivate tenant
        await db.collection("Tenant").updateOne(
            { _id: tenant._id },
            {
                $set: {
                    isActive: false,
                    leaseEndDate: now,
                    updatedAt: now
                }
            }
        )

        // Mark flat as Vacant
        await db.collection("Flat").updateOne(
            { _id: fId },
            {
                $set: {
                    status: "VACANT",
                    updatedAt: now
                }
            }
        )

        revalidatePath(`/flats/${flatId}`)
        revalidatePath(`/buildings/${flat.buildingId.toString()}`)
        revalidatePath('/dashboard')
        revalidatePath('/tenants')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to offboard tenant:", error)
        return { error: `Failed to offboard tenant: ${error.message || String(error)}` }
    }
}
