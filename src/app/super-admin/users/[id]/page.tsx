"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getUserDetail, updateUser, resetUserPassword, manualActivateOrganization } from "@/lib/actions/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, User, Building2, RefreshCw, Save, KeyRound, Shield, CheckCircle } from "lucide-react"

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    // Form fields
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [role, setRole] = useState("")

    // Password reset
    const [newPassword, setNewPassword] = useState("")
    const [resetLoading, setResetLoading] = useState(false)
    const [resetMessage, setResetMessage] = useState("")

    // Manual Activation
    const [billingCycle, setBillingCycle] = useState("MONTHLY")
    const [activating, setActivating] = useState(false)
    const [activationMessage, setActivationMessage] = useState("")

    useEffect(() => {
        async function load() {
            setLoading(true)
            const result = await getUserDetail(userId)
            if (result.success && result.data) {
                setUser(result.data)
                setName(result.data.name || "")
                setEmail(result.data.email || "")
                setPhone(result.data.phone || "")
                setRole(result.data.role)
            }
            setLoading(false)
        }
        load()
    }, [userId])

    async function handleSave() {
        setSaving(true)
        setMessage("")
        const result = await updateUser(userId, { name, email, role, phone })
        if (result.success) {
            setMessage("User updated successfully!")
        } else {
            setMessage(result.error || "Failed to update")
        }
        setSaving(false)
    }

    async function handleResetPassword() {
        if (newPassword.length < 6) return
        setResetLoading(true)
        setResetMessage("")
        const result = await resetUserPassword(userId, newPassword)
        if (result.success) {
            setResetMessage("Password reset successfully!")
            setNewPassword("")
        } else {
            setResetMessage(result.error || "Failed to reset password")
        }
        setResetLoading(false)
    }

    async function handleManualActivate() {
        if (!user?.organization?.id) return
        setActivating(true)
        setActivationMessage("")
        const result = await manualActivateOrganization(user.organization.id, billingCycle)
        if (result.success) {
            setActivationMessage("Organization activated successfully!")
            // Refresh user data
            const refreshed = await getUserDetail(userId)
            if (refreshed.success && refreshed.data) setUser(refreshed.data)
        } else {
            setActivationMessage(result.error || "Failed to activate organization")
        }
        setActivating(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return <div className="text-center py-12 text-muted-foreground">User not found.</div>
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <Link
                href="/super-admin/users"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Link>

            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{user.name || user.email}</h1>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
                <Badge className="ml-auto" variant={user.role === "SUPER_ADMIN" ? "destructive" : "default"}>
                    {user.role}
                </Badge>
            </div>

            {/* Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Edit User Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                                className="h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Phone number"
                                className="h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="h-10 border-gray-300 dark:border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {message && (
                        <div className={`text-sm p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Organization Info */}
            {user.organization && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-violet-500" />
                            Organization
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Name</span>
                                <span className="font-medium">{user.organization.name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Email</span>
                                <span>{user.organization.email}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Plan</span>
                                <Badge variant="outline">{user.organization.plan}</Badge>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Status</span>
                                {user.organization.isSuspended ? (
                                    <Badge variant="destructive">Suspended</Badge>
                                ) : user.organization.planStatus === 'ACTIVE' ? (
                                    <Badge className="bg-green-600">Active</Badge>
                                ) : user.organization.planStatus === 'PENDING_PAYMENT' ? (
                                    <Badge className="bg-amber-500 hover:bg-amber-600">Pending Payment</Badge>
                                ) : user.organization.planStatus === 'EXPIRED' ? (
                                    <Badge variant="destructive">Expired</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manual Verification Control Panel */}
            {user.organization && (user.organization.planStatus === 'PENDING_PAYMENT' || user.organization.planStatus === 'EXPIRED') && (
                <Card className="border-indigo-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
                            <Shield className="h-5 w-5" />
                            Manual Verification & Activation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 bg-indigo-50/10">
                        <p className="text-sm text-muted-foreground">
                            This overrides the automated payment process. Explicitly grant access for the following tenure:
                        </p>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="billing-cycle" className="text-indigo-900">Granted Tenure</Label>
                                <Select value={billingCycle} onValueChange={setBillingCycle}>
                                    <SelectTrigger className="h-10 border-indigo-200 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleManualActivate} 
                                disabled={activating}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {activating ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Verify Payment & Grant Access
                            </Button>
                        </div>
                        {activationMessage && (
                            <div className={`text-sm p-3 rounded-lg ${activationMessage.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                {activationMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Password Reset */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-amber-500" />
                        Reset Password
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="h-10 border-gray-300 dark:border-gray-700"
                            />
                        </div>
                        <Button onClick={handleResetPassword} disabled={resetLoading || newPassword.length < 6}>
                            {resetLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Reset
                        </Button>
                    </div>
                    {resetMessage && (
                        <div className={`text-sm p-3 rounded-lg ${resetMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {resetMessage}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                        <div>
                            <span className="text-muted-foreground block">User ID</span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{user.id}</code>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Created</span>
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Last Updated</span>
                            <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
