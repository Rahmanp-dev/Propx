'use server'

import clientPromise from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

const addDueSchema = z.object({
    tenantId: z.string(),
    label: z.string().min(1),
    amount: z.coerce.number().min(1),
    month: z.coerce.date()
})

export type AddDueInput = z.infer<typeof addDueSchema>

export async function addCustomDue(data: AddDueInput) {
    const result = addDueSchema.safeParse(data)
    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { tenantId, label, amount, month } = result.data

    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Unauthorized" }

        // Verify tenant belongs to user's org
        if (!orgCtx.isSuperAdmin) {
            const tenant = await prisma.tenant.findFirst({
                where: { id: tenantId, flat: { building: { organizationId: orgCtx.organizationId! } } }
            })
            if (!tenant) return { error: "Tenant not found or unauthorized" }
        }

        const client = await clientPromise
        const db = client.db("propx")

        // Start of the given month to identify the correct payment
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)

        const payment = await db.collection("Payment").findOne({
            tenantId: new ObjectId(tenantId),
            month: {
                $gte: startOfMonth,
                $lt: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1)
            }
        })

        if (!payment) {
            return { error: "No payment record found for this month to attach due." }
        }

        // We can safely push to customDuesList array natively, and use a pipeline for the math calculations.
        // Wait, MongoDB doesn't allow mixing $push (standard update) with pipeline updates.
        // But we can just use $set with $concatArrays if we are in a pipeline!
        
        await db.collection("Payment").updateOne(
            { _id: payment._id },
            [
                {
                    $set: {
                        customDues: { $add: [{ $ifNull: ["$customDues", 0] }, amount] },
                        customDuesList: {
                            $concatArrays: [
                                { $ifNull: ["$customDuesList", []] },
                                [{ label, amount, date: new Date() }]
                            ]
                        }
                    }
                },
                {
                    $set: {
                        totalDue: { $add: [{ $ifNull: ["$rentDue", 0] }, { $ifNull: ["$maintenanceDue", 0] }, { $ifNull: ["$electricityDue", 0] }, "$customDues", { $ifNull: ["$arrears", 0] }] },
                        updatedAt: new Date()
                    }
                },
                {
                    $set: {
                        balance: { $max: [0, { $subtract: ["$totalDue", { $ifNull: ["$amountPaid", 0] }] }] }
                    }
                },
                {
                    $set: {
                        status: {
                            $cond: {
                                if: { $lte: ["$balance", 0] }, then: "PAID",
                                else: {
                                    $cond: {
                                        if: { $gt: [{ $ifNull: ["$amountPaid", 0] }, 0] }, then: "PARTIAL", else: "PENDING"
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        )

        // Refetch the updated document to pass the exact new balance to the cascader
        const updatedPayment = await db.collection("Payment").findOne({ _id: payment._id })
        const finalBalance = updatedPayment ? (updatedPayment as any).balance : 0

        // We should cascade balance updates to future months since we added a due, and the current month balance changed
        await updateFutureBalances(tenantId, payment.month, finalBalance)

        revalidatePath('/', 'layout')

        return { success: true }
    } catch (error: any) {
        console.error("Failed to add custom due:", error)
        return { error: `Failed to add custom due: ${error.message || String(error)}` }
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
