'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getTenantLedger(tenantId: string) {
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }

        const payments = await prisma.payment.findMany({
            where: { tenantId },
            orderBy: { month: 'asc' },
            include: {
                flat: {
                    include: {
                        building: true
                    }
                }
            }
        })

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                flat: {
                    include: {
                        building: true
                    }
                }
            }
        })

        return { data: { payments, tenant } }
    } catch (error: any) {
        console.error("Failed to fetch tenant ledger:", error)
        return { error: `Failed to fetch ledger: ${error.message || String(error)}` }
    }
}

export async function getAllTenants() {
    try {
        const session = await auth()
        if (!session?.user) return { error: "Not authenticated" }
        const user = session.user as any

        const tenants = await prisma.tenant.findMany({
            where: user.role !== 'SUPER_ADMIN' ? {
                flat: {
                    building: {
                        organizationId: user.organizationId
                    }
                }
            } : {},
            include: {
                flat: {
                    include: {
                        building: true
                    }
                }
            },
            orderBy: { fullName: 'asc' }
        })

        return { data: tenants }
    } catch (error: any) {
        console.error("Failed to fetch tenants:", error)
        return { error: `Failed to fetch tenants: ${error.message || String(error)}` }
    }
}
