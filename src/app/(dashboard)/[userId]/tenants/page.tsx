import { getTenants } from "@/lib/actions/tenants"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Link from "next/link"

export default async function TenantsPage() {
    const { data: tenants, error } = await getTenants()

    if (error) {
        return <div className="p-8 text-center text-muted-foreground">Failed to load tenants.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">All Tenants</h1>
                <Badge variant="outline" className="text-lg px-4 py-1">
                    <Users className="mr-2 h-4 w-4" /> {tenants?.length || 0} Tenants
                </Badge>
            </div>

            {tenants && tenants.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => (
                        <Link key={tenant.id} href={tenant.flat ? `/flats/${tenant.flat.id}` : '#'}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{tenant.fullName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
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
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                    No tenants found. Onboard your first tenant from a flat page.
                </div>
            )}
        </div>
    )
}
