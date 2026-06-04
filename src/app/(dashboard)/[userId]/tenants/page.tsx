import { getTenants } from "@/lib/actions/tenants"
import { getPaymentMethods } from "@/lib/actions/settings"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { CopyPortalLink } from "@/components/dashboard/copy-portal-link"
import { EditTenantDialog } from "@/components/dashboard/edit-tenant-dialog"

export default async function TenantsPage() {
    const session = await auth()
    const userId = session?.user?.id || 'user'
    const { data: tenants, error } = await getTenants()
    const { data: paymentMethods = [] } = await getPaymentMethods()

    if (error) {
        return <div className="p-8 text-center text-muted-foreground">Failed to load tenants.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">All Tenants</h1>
                    <Badge variant="outline" className="text-lg px-4 py-1">
                        <Users className="mr-2 h-4 w-4" /> {tenants?.length || 0} Tenants
                    </Badge>
                </div>
                <CopyPortalLink />
            </div>

            {tenants && tenants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => {
                        const getStatusColor = (status: string) => {
                            switch (status) {
                                case 'PAID': return 'bg-green-100 text-green-800 border-green-200'
                                case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200'
                                default: return 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                        }
                        
                        return (
                        <Link key={tenant.id} href={tenant.flat ? `/${userId}/flats/${tenant.flat.id}` : '#'}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{tenant.fullName}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${getStatusColor(tenant.currentPaymentStatus)}`}>
                                                {tenant.currentPaymentStatus}
                                            </Badge>
                                            <div className="z-10">
                                                <EditTenantDialog tenant={tenant as any} paymentMethods={paymentMethods} />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center bg-muted/50 p-2 rounded-md mb-2">
                                            <span className="font-medium">Current Balance</span>
                                            <span className={`font-bold ${tenant.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ₹{tenant.currentBalance?.toLocaleString('en-IN') || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phone</span>
                                            <span>{tenant.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Flat</span>
                                            <span>{tenant.flat?.flatNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Building</span>
                                            <span>{tenant.flat?.building?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant={tenant.isActive ? "default" : "secondary"}>
                                                {tenant.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )})}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                    No tenants found. Onboard your first tenant from a flat page.
                </div>
            )}
        </div>
    )
}
