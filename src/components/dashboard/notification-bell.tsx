"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, IndianRupee, Wrench, FileText, UserPlus, Settings, CheckCheck } from "lucide-react"
import { getNotifications, markAllAsRead, getUnreadCount } from "@/lib/actions/notifications"

type Notification = {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    data: string | null
    createdAt: Date | string
}
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function getNotifCategory(type: string): string {
    if (type.startsWith("PAYMENT")) return "PAYMENT"
    if (type.startsWith("MAINTENANCE")) return "MAINTENANCE"
    if (type.startsWith("LEASE")) return "LEASE"
    if (type.startsWith("INQUIRY") || type.startsWith("VACANCY")) return "INQUIRY"
    return "SYSTEM"
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
    PAYMENT: IndianRupee,
    MAINTENANCE: Wrench,
    LEASE: FileText,
    INQUIRY: UserPlus,
    SYSTEM: Settings,
}

const NOTIFICATION_COLORS: Record<string, string> = {
    PAYMENT: "text-emerald-500 bg-emerald-50",
    MAINTENANCE: "text-orange-500 bg-orange-50",
    LEASE: "text-amber-500 bg-amber-50",
    INQUIRY: "text-cyan-500 bg-cyan-50",
    SYSTEM: "text-violet-500 bg-violet-50",
}

function timeAgo(dateStr: string | Date) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        getUnreadCount().then(res => setUnreadCount(res.data ?? 0))
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    async function handleOpen() {
        setOpen(!open)
        if (!open) {
            setLoading(true)
            const res = await getNotifications()
            setNotifications((res.data ?? []).slice(0, 5))
            setLoading(false)
        }
    }

    async function handleMarkAllRead() {
        await markAllAsRead()
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-lg hover:bg-white/10 transition"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-zinc-400 hover:text-white transition" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => {
                                const category = getNotifCategory(n.type)
                                const Icon = NOTIFICATION_ICONS[category] || Bell
                                const colorClass = NOTIFICATION_COLORS[category] || "text-gray-500 bg-gray-50"
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition",
                                            !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", colorClass)}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-gray-500 hover:text-gray-700"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                                Mark all as read
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
