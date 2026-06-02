import { auth } from "@/lib/auth"
import { getTenantMaintenanceRequests } from "@/lib/actions/tenant-portal"
import { redirect } from "next/navigation"
import { TenantNav } from "../tenant-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewMaintenanceForm } from "./new-request-form"

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-violet-100 text-violet-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
}

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-600",
    HIGH: "bg-orange-100 text-orange-600",
    URGENT: "bg-red-100 text-red-600",
}

export default async function TenantMaintenancePage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/tenant-portal/login')

    const requests = await getTenantMaintenanceRequests(session.user.id)

    return (
        <>
            <TenantNav tenantName={session.user?.name || ''} />
            <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Maintenance</h1>
                    <NewMaintenanceForm tenantId={session.user?.id as string} />
                </div>

                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No maintenance requests yet
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {requests.map((r: any) => (
                            <Card key={r.id}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-medium text-sm leading-tight flex-1">{r.title}</h3>
                                        <Badge className={STATUS_COLORS[r.status]}>
                                            {r.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[r.priority]}`}>
                                            {r.priority}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">
                                            {r.category.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    {r.notes && (
                                        <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-muted-foreground">
                                            <span className="font-medium">Update:</span> {r.notes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
