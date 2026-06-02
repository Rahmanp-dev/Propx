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

export async function searchGlobal(query: string) {
    if (!query || query.length < 2) return { results: [] }

    try {
        const orgCtx = await getOrgContext()
        if (!orgCtx) return { results: [] }

        // Org-scoped filters
        const buildingWhere = orgCtx.isSuperAdmin
            ? {}
            : { organizationId: orgCtx.organizationId! }

        const flatBuildingFilter = orgCtx.isSuperAdmin
            ? {}
            : { building: { organizationId: orgCtx.organizationId! } }

        const [tenants, buildings, flats] = await Promise.all([
            prisma.tenant.findMany({
                where: {
                    OR: [
                        { fullName: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query } }
                    ],
                    isActive: true,
                    flat: orgCtx.isSuperAdmin ? undefined : {
                        building: { organizationId: orgCtx.organizationId! }
                    }
                },
                include: { 
                    flat: { include: { building: true } },
                    payments: { orderBy: { month: 'desc' }, take: 1 }
                },
                take: 10
            }),
            prisma.building.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { address: { contains: query, mode: 'insensitive' } }
                    ],
                    ...buildingWhere,
                },
                take: 5
            }),
            prisma.flat.findMany({
                where: {
                    flatNumber: { contains: query, mode: 'insensitive' },
                    ...flatBuildingFilter,
                },
                include: { building: true },
                take: 5
            })
        ])

        return {
            results: {
                tenants: tenants.map(t => ({
                    type: 'TENANT',
                    id: t.id,
                    flatId: t.assignedFlatId,
                    title: t.fullName,
                    subtitle: `${t.flat?.building?.name || 'No Building'} - Flat ${t.flat?.flatNumber || 'Unassigned'}`,
                    extra: t.payments[0]?.status || 'UNKNOWN'
                })),
                buildings,
                flats
            }
        }
    } catch (error) {
        console.error("Search failed:", error)
        return { results: [] }
    }
}
