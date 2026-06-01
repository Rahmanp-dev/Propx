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

export async function getBuildingDetails(id: string) {
    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { error: "Not authenticated" }

        const building = await prisma.building.findUnique({
            where: { id },
            include: {
                floors: {
                    include: {
                        flats: {
                            include: {
                                tenants: {
                                    where: { isActive: true },
                                    take: 1
                                },
                                payments: {
                                    take: 1,
                                    orderBy: { createdAt: 'desc' }
                                }
                            },
                            orderBy: { flatNumber: 'asc' }
                        }
                    },
                    orderBy: { number: 'asc' }
                }
            }
        })

        // Verify building belongs to user's org
        if (building && !orgCtx.isSuperAdmin && building.organizationId !== orgCtx.organizationId) {
            return { error: "Building not found" }
        }

        return { success: true, data: building }
    } catch (error: any) {
        console.error("Failed to fetch building details:", error)
        return { error: `Failed to fetch building details: ${error.message || String(error)}` }
    }
}
