"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface UserButtonProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function UserButton({ user }: UserButtonProps) {
    if (!user) return null

    const initials = (user.name || "U").charAt(0).toUpperCase()

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-inner">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || "User"}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                </div>
            </div>
            
            <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-colors"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </button>
        </div>
    )
}
