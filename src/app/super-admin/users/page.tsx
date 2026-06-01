"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUsers, getOrganizations, resetUserPassword, deleteUser } from "@/lib/actions/super-admin"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Search, KeyRound, Trash2, Eye, RefreshCw, Shield, Building2 } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string
    phone: string | null
    role: string
    organizationId: string | null
    createdAt: string
    updatedAt: string
    organization: {
        id: string
        name: string
        isActive: boolean
        isSuspended: boolean
    } | null
}

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [organizations, setOrganizations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [orgFilter, setOrgFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
    const [deleteUserName, setDeleteUserName] = useState("")
    const [actionLoading, setActionLoading] = useState(false)
    const [actionMessage, setActionMessage] = useState("")
    const router = useRouter()

    async function loadData() {
        setLoading(true)
        const filters: any = {}
        if (roleFilter !== "all") filters.role = roleFilter
        if (orgFilter !== "all") filters.organizationId = orgFilter

        const [usersRes, orgsRes] = await Promise.all([
            getUsers(filters),
            getOrganizations(),
        ])

        if (usersRes.success && usersRes.data) setUsers(usersRes.data)
        if (orgsRes.success && orgsRes.data) setOrganizations(orgsRes.data)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [roleFilter, orgFilter])

    const filteredUsers = users.filter((user) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            (user.name?.toLowerCase().includes(q)) ||
            user.email.toLowerCase().includes(q) ||
            (user.phone?.includes(q)) ||
            (user.organization?.name.toLowerCase().includes(q))
        )
    })

    async function handleResetPassword() {
        if (!resetPasswordUserId || !newPassword) return
        setActionLoading(true)
        const result = await resetUserPassword(resetPasswordUserId, newPassword)
        if (result.success) {
            setActionMessage("Password reset successfully!")
            setNewPassword("")
            setTimeout(() => {
                setResetPasswordUserId(null)
                setActionMessage("")
            }, 1500)
        } else {
            setActionMessage(result.error || "Failed to reset password")
        }
        setActionLoading(false)
    }

    async function handleDeleteUser() {
        if (!deleteUserId) return
        setActionLoading(true)
        const result = await deleteUser(deleteUserId)
        if (result.success) {
            setActionMessage("User deleted successfully!")
            setTimeout(() => {
                setDeleteUserId(null)
                setDeleteUserName("")
                setActionMessage("")
                loadData()
            }, 1500)
        } else {
            setActionMessage(result.error || "Failed to delete user")
        }
        setActionLoading(false)
    }

    const roleBadge = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN":
                return <Badge className="bg-red-600">Super Admin</Badge>
            case "OWNER":
                return <Badge className="bg-blue-600">Owner</Badge>
            case "MANAGER":
                return <Badge className="bg-purple-600">Manager</Badge>
            default:
                return <Badge variant="secondary">{role}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-amber-500" />
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all platform users across organizations
                    </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                    {filteredUsers.length} Users
                </Badge>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, phone, or org..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px] h-10 border-gray-300 dark:border-gray-700">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                <SelectItem value="OWNER">Owner</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={orgFilter} onValueChange={setOrgFilter}>
                            <SelectTrigger className="w-[220px] h-10 border-gray-300 dark:border-gray-700">
                                <SelectValue placeholder="Filter by org" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map((org: any) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name || "—"}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{roleBadge(user.role)}</TableCell>
                                        <TableCell>
                                            {user.organization ? (
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{user.organization.name}</span>
                                                    {user.organization.isSuspended && (
                                                        <Badge variant="destructive" className="text-[10px] ml-1">Suspended</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    asChild
                                                >
                                                    <Link href={`/super-admin/users/${user.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => {
                                                        setResetPasswordUserId(user.id)
                                                        setActionMessage("")
                                                        setNewPassword("")
                                                    }}
                                                >
                                                    <KeyRound className="h-4 w-4 text-amber-600" />
                                                </Button>
                                                {user.role !== "SUPER_ADMIN" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => {
                                                            setDeleteUserId(user.id)
                                                            setDeleteUserName(user.name || user.email)
                                                            setActionMessage("")
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Reset Password Dialog */}
            <Dialog
                open={!!resetPasswordUserId}
                onOpenChange={(open) => {
                    if (!open) {
                        setResetPasswordUserId(null)
                        setNewPassword("")
                        setActionMessage("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-amber-500" />
                            Reset Password
                        </DialogTitle>
                        <DialogDescription>
                            Enter a new password for this user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        {actionMessage && (
                            <div className={`text-sm p-2 rounded ${actionMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {actionMessage}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResetPasswordUserId(null)
                                setNewPassword("")
                                setActionMessage("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={actionLoading || newPassword.length < 6}
                        >
                            {actionLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog
                open={!!deleteUserId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteUserId(null)
                        setDeleteUserName("")
                        setActionMessage("")
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteUserName}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {actionMessage && (
                        <div className={`text-sm p-2 rounded ${actionMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {actionMessage}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteUserId(null)
                                setDeleteUserName("")
                                setActionMessage("")
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
