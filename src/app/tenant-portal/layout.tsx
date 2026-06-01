import { getTenantSession } from "@/lib/tenant-auth"
import { redirect } from "next/navigation"
import { TenantNav } from "./tenant-nav"

export const metadata = {
    title: "PropX — Tenant Portal",
    description: "View your rent, payments, and maintenance requests",
}

export default async function TenantPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    )
}
