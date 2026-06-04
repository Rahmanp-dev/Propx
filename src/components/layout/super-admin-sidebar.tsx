"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    IndianRupee,
    Settings,
    Shield,
} from "lucide-react"
import { UserButton } from "@/components/shared/user-button"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/super-admin/dashboard",
        color: "text-sky-400",
    },
    {
        label: "Organizations",
        icon: Building2,
        href: "/super-admin/organizations",
        color: "text-violet-400",
    },
    {
        label: "Users",
        icon: Users,
        href: "/super-admin/users",
        color: "text-amber-400",
    },
    {
        label: "Payments",
        icon: IndianRupee,
        href: "/super-admin/payments",
        color: "text-emerald-400",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/super-admin/settings",
        color: "text-zinc-400",
    },
]

export function SuperAdminSidebar({ user }: { user?: any }) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-white/5">
                <Link href="/super-admin/dashboard" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg shadow-lg overflow-hidden bg-white/10 flex items-center justify-center">
                        <img src="/logo.png" alt="Company Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">PropX</h1>
                        <p className="text-[10px] font-medium text-amber-400/80 uppercase tracking-widest">Super Admin</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {routes.map((route) => {
                    const isActive = pathname === route.href ||
                        (route.href !== "/super-admin/dashboard" && pathname.startsWith(route.href))
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm border-l-2 border-amber-400 ml-0 pl-[10px]"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent ml-0 pl-[10px]"
                            )}
                        >
                            <route.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", isActive ? route.color : "text-zinc-500 group-hover:text-zinc-300")} />
                            {route.label}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="px-3 py-4 border-t border-white/5">
                <UserButton user={user} />
            </div>
        </div>
    )
}
