'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { revalidatePath } from "next/cache"

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

const editTenantSchema = z.object({
    tenantId: z.string(),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    aadhaarNumber: z.string().optional().or(z.literal("")),
    occupantsCount: z.coerce.number().min(1),
    emergencyContact: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    paymentMethodId: z.string().optional().or(z.literal("")),
})

export type EditTenantInput = z.infer<typeof editTenantSchema>

export async function updateTenantDetails(data: EditTenantInput) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const result = editTenantSchema.safeParse(data)
        if (!result.success) {
            return { error: "Invalid data provided", details: result.error.flatten() }
        }

        const { tenantId, ...updateData } = result.data

        const existingTenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { flat: { include: { building: true } } }
        })

        if (!existingTenant) return { error: "Tenant not found" }

        // Org check
        if (!orgCtx.isSuperAdmin && existingTenant.flat?.building?.organizationId !== orgCtx.organizationId) {
            return { error: "Not authorized to edit this tenant" }
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...updateData,
                email: updateData.email || null,
                aadhaarNumber: updateData.aadhaarNumber || null,
                emergencyContact: updateData.emergencyContact || null,
                notes: updateData.notes || null,
                paymentMethodId: updateData.paymentMethodId || null,
            }
        })

        revalidatePath('/', 'layout')
        if (existingTenant.assignedFlatId) {
            revalidatePath('/', 'layout')
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to update tenant:", error)
        return { error: "Failed to update tenant" }
    }
}
