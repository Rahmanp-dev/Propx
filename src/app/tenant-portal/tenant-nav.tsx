"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, IndianRupee, Wrench, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

const navItems = [
    { label: "Home", href: "/tenant-portal/dashboard", icon: Home },
    { label: "Payments", href: "/tenant-portal/payments", icon: IndianRupee },
    { label: "Maintenance", href: "/tenant-portal/maintenance", icon: Wrench },
]

export function TenantNav({ tenantName }: { tenantName: string }) {
    const pathname = usePathname()
    const router = useRouter()

    async function handleLogout() {
        await signOut({ callbackUrl: '/tenant-portal/login' })
    }

    return (
        <>
            {/* Top Bar */}
            <header className="bg-white border-b sticky top-0 z-40">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/tenant-portal/dashboard" className="text-xl font-bold text-gray-900">
                        PropX
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground hidden sm:inline">{tenantName}</span>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Bottom Navigation (mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
                <div className="max-w-lg mx-auto flex items-center justify-around py-2">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition",
                                pathname === item.href
                                    ? "text-blue-600"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    )
}
