import { getOrganizations } from "@/lib/actions/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Building2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrgFilters } from "./org-filters"

export const dynamic = 'force-dynamic'

function getPlanBadge(plan: string) {
    switch (plan) {
        case 'STARTER':
            return <Badge variant="secondary">Starter</Badge>
        case 'BUILDER':
            return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Builder</Badge>
        case 'PORTFOLIO':
            return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Portfolio</Badge>
        default:
            return <Badge variant="secondary">{plan}</Badge>
    }
}

function getStatusBadge(org: any) {
    if (org.isSuspended) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
    if (org.isActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

export default async function OrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; plan?: string }>
}) {
    const params = await searchParams
    const result = await getOrganizations({
        status: params.status,
        plan: params.plan,
    })

    if (!result.success || !result.data) {
        return <div className="text-red-500">Failed to load organizations: {result.error}</div>
    }

    const orgs = result.data

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
                    <p className="text-muted-foreground">Manage all registered organizations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{orgs.length} total</span>
                </div>
            </div>

            {/* Filters */}
            <OrgFilters currentStatus={params.status} currentPlan={params.plan} />

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Tenure</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Buildings</TableHead>
                                <TableHead className="text-center">Units</TableHead>
                                <TableHead className="text-center">Users</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.map((org: any) => (
                                <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <Link href={`/super-admin/organizations/${org.id}`} className="hover:underline">
                                            {org.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{org.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {org.users?.[0]?.name || org.ownerName}
                                        <div className="text-xs text-muted-foreground">
                                            {org.users?.[0]?.email || ''}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPlanBadge(org.plan)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {({'MONTHLY':'Monthly','QUARTERLY':'Quarterly','HALF_YEARLY':'Half-Yearly','YEARLY':'Yearly','ANNUAL':'Yearly'} as Record<string, string>)[org.billingCycle] || org.billingCycle}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(org)}</TableCell>
                                    <TableCell className="text-center">{org._count?.buildings || 0}</TableCell>
                                    <TableCell className="text-center">{org.unitCount || 0}</TableCell>
                                    <TableCell className="text-center">{org._count?.users || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/super-admin/organizations/${org.id}`}>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {orgs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                                        No organizations found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
