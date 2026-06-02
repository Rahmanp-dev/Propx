'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
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

const logPaymentSchema = z.object({
    paymentId: z.string(),
    amount: z.coerce.number().min(1),
    method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    notes: z.string().optional(),
    upiReference: z.string().optional()
})

export type LogPaymentInput = z.infer<typeof logPaymentSchema>

export async function logPayment(data: LogPaymentInput) {
    const orgCtx = await getOrgContext()
    if (!orgCtx) return { error: "Not authenticated" }

    const result = logPaymentSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { paymentId, amount, method, notes, upiReference } = result.data

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                flat: {
                    include: {
                        building: { select: { organizationId: true } }
                    }
                }
            }
        })

        if (!payment) return { error: "Payment record not found" }

        // Verify org ownership
        if (!orgCtx.isSuperAdmin && payment.flat.building.organizationId !== orgCtx.organizationId) {
            return { error: "Payment record not found" }
        }

        const newAmountPaid = payment.amountPaid + amount
        const newBalance = payment.totalDue - newAmountPaid

        let newStatus = payment.status
        if (newBalance <= 0) {
            newStatus = "PAID"
        } else if (newAmountPaid > 0) {
            newStatus = "PARTIAL"
        }

        const client = await clientPromise
        const db = client.db("propx")

        const updateNotes = notes
            ? (payment.notes ? `${payment.notes}\n${notes}` : notes)
            : payment.notes

        await db.collection("Payment").updateOne(
            { _id: new ObjectId(paymentId) },
            {
                $set: {
                    amountPaid: newAmountPaid,
                    balance: Math.max(0, newBalance),
                    status: newStatus,
                    paymentMethod: method,
                    upiReference: upiReference || payment.upiReference,
                    paymentDate: new Date(),
                    notes: updateNotes,
                    updatedAt: new Date()
                }
            }
        )

        // Add Notification
        if (payment.flat.building.organizationId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(payment.flat.building.organizationId),
                type: "PAYMENT_RECEIVED",
                title: "Payment Received",
                message: `Received ₹${amount.toLocaleString()} via ${method} for Flat ${payment.flat.flatNumber}.`,
                isRead: false,
                data: JSON.stringify({ paymentId, amount, method }),
                createdAt: new Date(),
            })

            // Fire and forget push notification
            sendPushToOrganization(payment.flat.building.organizationId, {
                title: "Payment Received",
                message: `Received ₹${amount.toLocaleString()} via ${method} for Flat ${payment.flat.flatNumber}.`,
                url: `/finance`
            }).catch(console.error)
        }

        // Cascade balance updates to future months
        await updateFutureBalances(payment.tenantId, payment.month, Math.max(0, newBalance))

        // Revalidate ALL relevant pages so finance & dashboard reflect instantly
        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath(`/flats/${payment.flatId}`)
        revalidatePath(`/buildings/${payment.flat.buildingId}`)
        revalidatePath('/')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to log payment:", error)
        return { error: `Failed to log payment: ${error.message || String(error)}` }
    }
}

async function updateFutureBalances(tenantId: string, currentPaymentMonth: Date, newBalanceFromCurrent: number) {
    try {
        const client = await clientPromise
        const db = client.db("propx")

        const futurePayments = await db.collection("Payment").find({
            tenantId: new ObjectId(tenantId),
            month: { $gt: currentPaymentMonth }
        }).sort({ month: 1 }).toArray()

        let carriedBalance = newBalanceFromCurrent

        for (const payment of futurePayments) {
            const newArrears = carriedBalance
            const newTotalDue = (payment.rentDue || 0) + (payment.maintenanceDue || 0) + (payment.electricityDue || 0) + (payment.customDues || 0) + newArrears
            const newBalance = newTotalDue - (payment.amountPaid || 0)

            let newStatus = payment.status
            if (newBalance <= 0) {
                newStatus = "PAID"
            } else if ((payment.amountPaid || 0) > 0) {
                newStatus = "PARTIAL"
            } else {
                newStatus = "PENDING"
            }

            await db.collection("Payment").updateOne(
                { _id: payment._id },
                {
                    $set: {
                        arrears: newArrears,
                        totalDue: newTotalDue,
                        balance: Math.max(0, newBalance),
                        status: newStatus,
                        updatedAt: new Date()
                    }
                }
            )

            carriedBalance = Math.max(0, newBalance)
        }
    } catch (error) {
        console.error("Failed to cascade balance updates:", error)
    }
}
