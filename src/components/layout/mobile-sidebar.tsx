"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function MobileSidebar({ user }: { user?: any }) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#111827] border-r-gray-800 text-white w-72 max-w-[288px]">
                <Sidebar user={user} />
            </SheetContent>
        </Sheet>
    )
}
