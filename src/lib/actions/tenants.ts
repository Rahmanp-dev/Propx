'use server'

import prisma from "@/lib/prisma"
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

export async function getTenants() {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const where = orgCtx.isSuperAdmin
            ? {}
            : { flat: { building: { organizationId: orgCtx.organizationId! } } }

        const tenants = await prisma.tenant.findMany({
            where,
            include: {
                flat: {
                    include: {
                        building: {
                            select: { name: true }
                        }
                    }
                },
                payments: {
                    orderBy: { month: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        
        // Map the tenants to include current payment info directly for easier access
        const mappedTenants = tenants.map(tenant => {
            const latestPayment = tenant.payments?.[0];
            return {
                ...tenant,
                currentPaymentStatus: latestPayment?.status || 'PENDING',
                currentBalance: latestPayment?.balance || 0,
            }
        })
        
        return { success: true, data: mappedTenants }
    } catch (error) {
        console.error("Failed to fetch tenants:", error)
        return { error: "Failed to fetch tenants" }
    }
}
