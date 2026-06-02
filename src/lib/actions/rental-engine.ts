'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { sendPushToOrganization } from "./push"

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

export async function generateMonthlyDues() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const client = await clientPromise
        const db = client.db("propx")

        const today = new Date()
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const readingMonth = today.getMonth()
        const readingYear = today.getFullYear()
        const prevMonthIndex = readingMonth === 0 ? 11 : readingMonth - 1
        const prevYearIndex = readingMonth === 0 ? readingYear - 1 : readingYear

        // Get all active tenants with Flat AND Building details — scoped by org
        const tenantWhere: Record<string, any> = {
            isActive: true,
            leaseStartDate: { lte: today },
            OR: [
                { leaseEndDate: null },
                { leaseEndDate: { gte: today } }
            ]
        }

        // Scope through flat→building→org
        if (!orgCtx.isSuperAdmin) {
            tenantWhere.flat = { building: { organizationId: orgCtx.organizationId! } }
        }

        const activeTenants = await prisma.tenant.findMany({
            where: tenantWhere,
            include: {
                flat: {
                    include: {
                        building: true
                    }
                }
            }
        })

        let generatedCount = 0

        for (const tenant of activeTenants) {
            if (!tenant.flat || !tenant.assignedFlatId) continue

            // Check if already generated
            const existingPayment = await db.collection("Payment").findOne({
                tenantId: new ObjectId(tenant.id),
                month: currentMonth
            })

            if (existingPayment) continue

            // Get Arrears from last month
            const lastPaymentCursor = db.collection("Payment").find({
                tenantId: new ObjectId(tenant.id),
                month: { $lt: currentMonth }
            }).sort({ month: -1 }).limit(1)

            const lastPayment = await lastPaymentCursor.next()
            const arrears = lastPayment ? Math.max(0, (lastPayment as any).balance || 0) : 0

            // Calculate Electricity Bill
            let electricityDue = 0.0

            const currentReading = await db.collection("MeterReading").findOne({
                flatId: new ObjectId(tenant.assignedFlatId),
                month: readingMonth,
                year: readingYear
            })

            if (currentReading) {
                const prevReading = await db.collection("MeterReading").findOne({
                    flatId: new ObjectId(tenant.assignedFlatId),
                    month: prevMonthIndex,
                    year: prevYearIndex
                })

                if (prevReading) {
                    const unitsConsumed = (currentReading as any).reading - (prevReading as any).reading
                    if (unitsConsumed > 0) {
                        const rate = tenant.flat.building.ratePerUnit || 10
                        electricityDue = unitsConsumed * rate
                    }
                }
            }

            // Calculate Total Dues
            const rentDue = tenant.flat.rentAmount
            const maintenanceDue = tenant.flat.maintenanceAmount
            const totalDue = rentDue + maintenanceDue + electricityDue + arrears

            // Create Payment Record
            const now = new Date()
            await db.collection("Payment").insertOne({
                tenantId: new ObjectId(tenant.id),
                flatId: new ObjectId(tenant.assignedFlatId),
                month: currentMonth,
                rentDue,
                maintenanceDue,
                electricityDue,
                arrears,
                totalDue,
                balance: totalDue,
                status: 'PENDING',
                amountPaid: 0.0,
                createdAt: now,
                updatedAt: now
            })

            generatedCount++
        }

        // Add notification for the organization
        if (generatedCount > 0 && orgCtx.organizationId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(orgCtx.organizationId),
                type: "SYSTEM",
                title: "Monthly Dues Generated",
                message: `Successfully generated ${generatedCount} payment bills for ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
                isRead: false,
                data: JSON.stringify({ generatedCount, month: currentMonth }),
                createdAt: new Date(),
            })

            // Fire and forget push notification
            sendPushToOrganization(orgCtx.organizationId, {
                title: "Monthly Dues Generated",
                message: `Successfully generated ${generatedCount} payment bills for ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
                url: `/finance`
            }).catch(console.error)
        }

        // Revalidate all relevant pages
        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath('/tenants')
        revalidatePath('/')
        return { success: true, count: generatedCount }

    } catch (error: any) {
        console.error("Failed to generate monthly dues:", error)
        return { error: `Failed to generate monthly dues: ${error.message || String(error)}` }
    }
}
