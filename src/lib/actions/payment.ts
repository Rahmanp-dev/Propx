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

        const client = await clientPromise
        const db = client.db("propx")

        const updateNotes = notes
            ? (payment.notes ? `${payment.notes}\n${notes}` : notes)
            : payment.notes

        const updatedDoc = await db.collection("Payment").findOneAndUpdate(
            { _id: new ObjectId(paymentId) },
            [
                {
                    $set: {
                        amountPaid: { $add: [{ $ifNull: ["$amountPaid", 0] }, amount] },
                        paymentMethod: method,
                        upiReference: upiReference || payment.upiReference || null,
                        paymentDate: new Date(),
                        notes: updateNotes,
                        updatedAt: new Date()
                    }
                },
                {
                    $set: {
                        balance: { $max: [0, { $subtract: ["$totalDue", "$amountPaid"] }] }
                    }
                },
                {
                    $set: {
                        status: {
                            $cond: {
                                if: { $lte: ["$balance", 0] }, then: "PAID",
                                else: {
                                    $cond: {
                                        if: { $gt: ["$amountPaid", 0] }, then: "PARTIAL", else: "PENDING"
                                    }
                                }
                            }
                        }
                    }
                }
            ],
            { returnDocument: 'after' }
        )

        const finalBalance = updatedDoc ? (updatedDoc as any).balance : 0

        // Add Notification
        if (payment.flat.building.organizationId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(payment.flat.building.organizationId),
                type: "PAYMENT_RECEIVED",
                title: "Payment Received",
                message: `Received ₹${amount.toLocaleString('en-IN')} via ${method} for Flat ${payment.flat.flatNumber}.`,
                isRead: false,
                data: JSON.stringify({ paymentId, amount, method }),
                createdAt: new Date(),
            })

            // Fire and forget push notification
            sendPushToOrganization(payment.flat.building.organizationId, {
                title: "Payment Received",
                message: `Received ₹${amount.toLocaleString('en-IN')} via ${method} for Flat ${payment.flat.flatNumber}.`,
                url: `/finance`
            }).catch(console.error)
        }

        // Cascade balance updates to future months
        await updateFutureBalances(payment.tenantId, payment.month, Math.max(0, finalBalance))

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

export async function markAllMonthAsPaid(monthStr: string, method: string = "CASH") {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const startDate = new Date(`${monthStr}-01T00:00:00.000Z`)
        startDate.setHours(startDate.getHours() - 12)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)

        const payments = await prisma.payment.findMany({
            where: {
                month: { gte: startDate, lt: endDate },
                balance: { gt: 0 },
                ...(orgCtx.isSuperAdmin ? {} : {
                    flat: { building: { organizationId: orgCtx.organizationId! } }
                })
            }
        })

        let markedCount = 0
        for (const p of payments) {
            await logPayment({
                paymentId: p.id,
                amount: p.balance,
                method: method as any,
                notes: "Bulk marked as paid for the month."
            })
            markedCount++
        }

        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath(`/[userId]/ledger`, 'page')
        
        return { success: true, count: markedCount }
    } catch (error: any) {
        console.error("Failed to bulk mark as paid:", error)
        return { error: `Failed to mark all as paid: ${error.message || String(error)}` }
    }
}
