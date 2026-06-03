'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { z } from "zod"

const uploadPaymentProofSchema = z.object({
    screenshotUrl: z.string().url(),
    uploadedBy: z.enum(['tenant', 'owner']),
    upiTransactionId: z.string().optional(),
})

const verifyPaymentProofSchema = z.object({
    verified: z.boolean(),
    notes: z.string().optional(),
})

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

// ==========================================
// MUTATIONS
// ==========================================

export async function uploadPaymentProof(paymentId: string, data: {
    screenshotUrl: string
    uploadedBy: 'tenant' | 'owner'
    upiTransactionId?: string
}) {
    const result = uploadPaymentProofSchema.safeParse(data)
    if (!result.success) return { error: "Invalid input data" }
    const parsedData = result.data

    try {
        // Validate payment exists
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                flat: {
                    include: {
                        building: {
                            select: { id: true, organizationId: true, name: true }
                        }
                    }
                },
                tenant: { select: { fullName: true } }
            }
        })

        if (!payment) return { error: "Payment not found" }

        const client = await clientPromise
        const db = client.db("propx")

        const now = new Date()
        const proofDoc = {
            paymentId: new ObjectId(paymentId),
            uploadedBy: parsedData.uploadedBy,
            screenshotUrl: parsedData.screenshotUrl,
            upiTransactionId: parsedData.upiTransactionId || null,
            isVerified: false,
            verifiedAt: null,
            notes: null,
            createdAt: now,
        }

        const insertResult = await db.collection("PaymentProof").insertOne(proofDoc)

        // Create notification for the owner
        const orgId = payment.flat.building.organizationId
        if (orgId) {
            await db.collection("Notification").insertOne({
                organizationId: new ObjectId(orgId),
                type: "PAYMENT_PROOF_UPLOADED",
                title: "Payment Proof Uploaded",
                message: `${payment.tenant.fullName} uploaded payment proof for Flat ${payment.flat.flatNumber} (₹${payment.totalDue.toLocaleString('en-IN')})`,
                isRead: false,
                data: JSON.stringify({ paymentId, proofId: insertResult.insertedId.toString() }),
                createdAt: now,
            })
        }

        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath(`/pay/${paymentId}`)

        return { success: true, data: { id: insertResult.insertedId.toString() } }
    } catch (error: any) {
        console.error("Failed to upload payment proof:", error)
        return { error: `Failed to upload payment proof: ${error.message || String(error)}` }
    }
}

export async function verifyPaymentProof(proofId: string, verified: boolean, notes?: string) {
    const result = verifyPaymentProofSchema.safeParse({ verified, notes })
    if (!result.success) return { error: "Invalid input data" }

    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Get the proof and its payment
        const proof = await prisma.paymentProof.findUnique({
            where: { id: proofId },
            include: {
                payment: {
                    include: {
                        flat: {
                            include: {
                                building: { select: { organizationId: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!proof) return { error: "Payment proof not found" }

        // Verify org ownership (unless super admin)
        if (!orgCtx.isSuperAdmin && proof.payment.flat.building.organizationId !== orgCtx.organizationId) {
            return { error: "Unauthorized" }
        }

        const client = await clientPromise
        const db = client.db("propx")
        const now = new Date()

        // Update proof verification status
        await db.collection("PaymentProof").updateOne(
            { _id: new ObjectId(proofId) },
            {
                $set: {
                    isVerified: verified,
                    verifiedAt: verified ? now : null,
                    notes: notes || null,
                }
            }
        )

        // If verified: update the Payment to PAID using atomic pipeline
        if (verified) {
            await db.collection("Payment").updateOne(
                { _id: new ObjectId(proof.payment.id) },
                [
                    {
                        $set: {
                            status: "PAID",
                            amountPaid: "$totalDue",
                            balance: 0,
                            paymentDate: now,
                            paymentMethod: "UPI",
                            verifiedByOwner: true,
                            updatedAt: now,
                        }
                    }
                ]
            )
        }

        revalidatePath('/dashboard')
        revalidatePath('/finance')
        revalidatePath(`/pay/${proof.paymentId}`)

        return { success: true }
    } catch (error: any) {
        console.error("Failed to verify payment proof:", error)
        return { error: `Failed to verify payment proof: ${error.message || String(error)}` }
    }
}

// ==========================================
// QUERIES
// ==========================================

export async function getPaymentProofs(paymentId: string) {
    try {
        const proofs = await prisma.paymentProof.findMany({
            where: { paymentId },
            orderBy: { createdAt: 'desc' },
        })

        return { success: true, data: proofs }
    } catch (error: any) {
        console.error("Failed to fetch payment proofs:", error)
        return { error: `Failed to fetch payment proofs: ${error.message || String(error)}` }
    }
}

export async function getPendingVerifications() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        // Build org-scoped building filter
        const buildingWhere = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        const proofs = await prisma.paymentProof.findMany({
            where: {
                isVerified: false,
                payment: {
                    flat: {
                        building: buildingWhere,
                    }
                }
            },
            include: {
                payment: {
                    include: {
                        tenant: { select: { fullName: true, phone: true } },
                        flat: {
                            select: {
                                flatNumber: true,
                                flatType: true,
                                building: { select: { name: true } },
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        })

        return { success: true, data: proofs }
    } catch (error: any) {
        console.error("Failed to fetch pending verifications:", error)
        return { error: `Failed to fetch pending verifications: ${error.message || String(error)}` }
    }
}
