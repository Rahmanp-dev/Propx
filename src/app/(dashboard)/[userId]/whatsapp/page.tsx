import { getWhatsAppLogs, getWhatsAppStats } from "@/lib/actions/whatsapp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, CheckCheck, Eye, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SendRemindersButton } from "@/components/dashboard/send-reminders-button"
import { BroadcastDialog } from "@/components/dashboard/broadcast-dialog"

export const dynamic = 'force-dynamic'

const MSG_TYPE_STYLES: Record<string, string> = {
    RENT_REMINDER: "bg-blue-100 text-blue-700",
    BROADCAST: "bg-purple-100 text-purple-700",
    PAYMENT_RECEIPT: "bg-green-100 text-green-700",
    MAINTENANCE_UPDATE: "bg-teal-100 text-teal-700",
    LEASE_ALERT: "bg-amber-100 text-amber-700",
    INQUIRY_RESPONSE: "bg-cyan-100 text-cyan-700",
}

const MSG_STATUS_STYLES: Record<string, string> = {
    QUEUED: "bg-gray-100 text-gray-700 border-gray-200",
    SENT: "bg-blue-100 text-blue-700 border-blue-200",
    DELIVERED: "bg-green-100 text-green-700 border-green-200",
    READ: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
}

function formatDate(date: Date | string | null) {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default async function WhatsAppPage() {
    const [msgRes, statsRes] = await Promise.all([
        getWhatsAppLogs(50),
        getWhatsAppStats(),
    ])

    const messages = msgRes.data || []
    const statsData = statsRes.data || { total: 0, byStatus: { QUEUED: 0, SENT: 0, DELIVERED: 0, READ: 0, FAILED: 0 }, byType: {} }

    const { total, byStatus } = statsData

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">WhatsApp Center</h1>
                    <p className="text-muted-foreground">Manage tenant communications via WhatsApp</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <SendRemindersButton />
                    <BroadcastDialog />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{total}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <CheckCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{byStatus.DELIVERED + byStatus.READ}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${total > 0 ? Math.round(((byStatus.DELIVERED + byStatus.READ) / total) * 100) : 0}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium">
                                {total > 0 ? Math.round(((byStatus.DELIVERED + byStatus.READ) / total) * 100) : 0}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Read</CardTitle>
                        <Eye className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{byStatus.READ}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${total > 0 ? Math.round((byStatus.READ / total) * 100) : 0}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium">
                                {total > 0 ? Math.round((byStatus.READ / total) * 100) : 0}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{byStatus.FAILED}</div>
                        <p className="text-xs text-muted-foreground">Need attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Message Log */}
            <Card>
                <CardHeader>
                    <CardTitle>Message Log</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Mobile: Card layout */}
                    <div className="space-y-3 md:hidden">
                        {messages.map((msg: any) => (
                            <div key={msg.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{msg.tenant?.fullName || "Unknown"}</span>
                                    <Badge variant="outline" className={cn("text-[10px]", MSG_STATUS_STYLES[msg.status])}>
                                        {msg.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{msg.phone}</span>
                                    <Badge variant="outline" className={cn("text-[10px]", MSG_TYPE_STYLES[msg.messageType] || "")}>
                                        {msg.messageType.replace(/_/g, " ")}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDate(msg.sentAt || msg.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-3 text-xs font-medium text-muted-foreground">Tenant</th>
                                    <th className="pb-3 text-xs font-medium text-muted-foreground">Phone</th>
                                    <th className="pb-3 text-xs font-medium text-muted-foreground">Type</th>
                                    <th className="pb-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="pb-3 text-xs font-medium text-muted-foreground text-right">Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.map((msg: any) => (
                                    <tr key={msg.id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                                        <td className="py-3 text-sm font-medium">{msg.tenant?.fullName || "Unknown"}</td>
                                        <td className="py-3 text-sm text-muted-foreground">{msg.phone}</td>
                                        <td className="py-3">
                                            <Badge variant="outline" className={cn("text-[10px]", MSG_TYPE_STYLES[msg.messageType] || "")}>
                                                {msg.messageType.replace(/_/g, " ")}
                                            </Badge>
                                        </td>
                                        <td className="py-3">
                                            <Badge variant="outline" className={cn("text-[10px]", MSG_STATUS_STYLES[msg.status])}>
                                                {msg.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-sm text-muted-foreground text-right">{formatDate(msg.sentAt || msg.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {messages.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No messages sent yet. Use "Send Rent Reminders" to get started.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
