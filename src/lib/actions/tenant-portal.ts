'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

export async function getTenantDashboard(tenantId: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                flat: {
                    include: {
                        building: true,
                        floor: true,
                    }
                }
            }
        })

        if (!tenant || !tenant.flat) return null

        // Current month payment
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const currentPayment = await prisma.payment.findFirst({
            where: {
                tenantId,
                month: { gte: startOfMonth, lte: endOfMonth },
            },
            orderBy: { month: 'desc' },
        })

        return {
            tenant: {
                id: tenant.id,
                fullName: tenant.fullName,
                phone: tenant.phone,
                email: tenant.email,
            },
            flat: {
                flatNumber: tenant.flat.flatNumber,
                flatType: tenant.flat.flatType,
                rentAmount: tenant.flat.rentAmount,
                maintenanceAmount: tenant.flat.maintenanceAmount,
                status: tenant.flat.status,
                floor: tenant.flat.floor?.number,
            },
            building: {
                name: tenant.flat.building.name,
                address: tenant.flat.building.address,
                city: tenant.flat.building.city,
            },
            currentPayment: currentPayment
                ? {
                    id: currentPayment.id,
                    month: currentPayment.month,
                    totalDue: currentPayment.totalDue,
                    amountPaid: currentPayment.amountPaid,
                    balance: currentPayment.balance,
                    status: currentPayment.status,
                    paymentDate: currentPayment.paymentDate,
                }
                : null,
        }
    } catch (error) {
        console.error("Failed to fetch tenant dashboard:", error)
        return null
    }
}

export async function getTenantPayments(tenantId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: { tenantId },
            include: {
                flat: {
                    select: { flatNumber: true }
                }
            },
            orderBy: { month: 'desc' },
        })

        return payments.map((p) => ({
            id: p.id,
            month: p.month,
            rentDue: p.rentDue,
            maintenanceDue: p.maintenanceDue,
            electricityDue: p.electricityDue,
            totalDue: p.totalDue,
            amountPaid: p.amountPaid,
            balance: p.balance,
            status: p.status,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            receiptNumber: p.receiptNumber,
            flatNumber: p.flat.flatNumber,
        }))
    } catch (error) {
        console.error("Failed to fetch tenant payments:", error)
        return []
    }
}

export async function getTenantMaintenanceRequests(tenantId: string) {
    try {
        const requests = await prisma.maintenanceRequest.findMany({
            where: { tenantId },
            include: {
                flat: { select: { flatNumber: true } },
                building: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return requests.map((r) => ({
            id: r.id,
            category: r.category,
            title: r.title,
            description: r.description,
            priority: r.priority,
            status: r.status,
            assignedTo: r.assignedTo,
            resolvedAt: r.resolvedAt,
            notes: r.notes,
            createdAt: r.createdAt,
            flatNumber: r.flat.flatNumber,
            buildingName: r.building.name,
        }))
    } catch (error) {
        console.error("Failed to fetch tenant maintenance requests:", error)
        return []
    }
}

export async function submitMaintenanceRequest(
    tenantId: string,
    data: {
        category: string
        title: string
        description: string
        priority: string
    }
) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                flat: {
                    select: {
                        id: true,
                        buildingId: true,
                        building: { select: { organizationId: true } }
                    }
                },
            },
        })

        if (!tenant?.flat) {
            return { success: false, error: 'Tenant not assigned to a flat' }
        }

        const client = await clientPromise
        const db = client.db('propx')

        const now = new Date()
        const result = await db.collection('MaintenanceRequest').insertOne({
            flatId: new ObjectId(tenant.flat.id),
            buildingId: new ObjectId(tenant.flat.buildingId),
            tenantId: new ObjectId(tenantId),
            category: data.category,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: 'OPEN',
            images: [],
            assignedTo: null,
            resolvedAt: null,
            cost: null,
            notes: null,
            createdAt: now,
            updatedAt: now,
        })

        // Notify admin — include organizationId for proper scoping
        const notifDoc: Record<string, any> = {
            type: 'MAINTENANCE_NEW',
            title: 'New Maintenance Request',
            message: `${data.title} — submitted by tenant via portal`,
            isRead: false,
            data: null,
            createdAt: now,
        }

        if (tenant.flat.building?.organizationId) {
            notifDoc.organizationId = new ObjectId(tenant.flat.building.organizationId)
        }

        await db.collection('Notification').insertOne(notifDoc)

        revalidatePath('/maintenance')
        revalidatePath('/tenant-portal/maintenance')

        return { success: true, requestId: result.insertedId.toString() }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to submit request' }
    }
}
