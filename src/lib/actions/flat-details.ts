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

export async function getFlatDetails(id: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const flat = await prisma.flat.findUnique({
            where: { id },
            include: {
                building: true,
                tenants: {
                    where: { isActive: true },
                    take: 1
                },
                payments: {
                    orderBy: { month: 'desc' },
                    take: 12 // Last year history
                }
            }
        })

        // Verify flat's building belongs to user's org
        if (flat && !orgCtx.isSuperAdmin && flat.building.organizationId !== orgCtx.organizationId) {
            return { error: "Flat not found" }
        }

        return { success: true, data: flat }
    } catch (error: any) {
        console.error("Failed to fetch flat details:", error)
        return { error: `Failed to fetch flat details: ${error.message || String(error)}` }
    }
}
