"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, IndianRupee, Wrench, LogOut } from "lucide-react"
import { handleSignOut } from "@/lib/actions/auth"

const navItems = [
    { label: "Home", href: "/tenant-portal/dashboard", icon: Home },
    { label: "Payments", href: "/tenant-portal/payments", icon: IndianRupee },
    { label: "Maintenance", href: "/tenant-portal/maintenance", icon: Wrench },
]

export function TenantNav({ tenantName }: { tenantName: string }) {
    const pathname = usePathname()

    async function handleLogout() {
        await handleSignOut('/tenant-portal/login')
    }

    return (
        <>
            {/* Top Bar */}
            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group" aria-label="Go to PropX home">
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                            <img src="/logo.png" alt="PropX" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                            Prop<span className="text-blue-600">X</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden sm:inline font-medium truncate max-w-[120px]">
                            {tenantName}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="max-w-lg mx-auto flex items-center justify-around py-2">
                    {navItems.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                className={cn(
                                    "flex flex-col items-center gap-1 py-2 px-5 rounded-xl transition-all min-w-[60px]",
                                    isActive
                                        ? "text-blue-600"
                                        : "text-gray-400 hover:text-gray-600 active:bg-gray-50"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                                <span className={cn("text-[10px] font-semibold", isActive ? "text-blue-600" : "text-gray-400")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <span className="absolute bottom-0 w-6 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
