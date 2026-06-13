"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function SuperAdminMobileSidebar({ user }: { user?: any }) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5 text-gray-600" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#0f172a] border-r border-indigo-950/50 text-white w-72 max-w-[85vw]">
                <SheetTitle className="sr-only">Super Admin Navigation Menu</SheetTitle>
                <SuperAdminSidebar user={user} />
            </SheetContent>
        </Sheet>
    )
}
