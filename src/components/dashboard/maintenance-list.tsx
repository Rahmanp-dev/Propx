"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, RefreshCw, Calendar, Building2, User } from "lucide-react"
import { createMaintenanceRequest, type CreateMaintenanceInput } from "@/lib/actions/maintenance"

type MaintenanceRequest = {
    id: string
    title: string
    description: string
    category: string
    priority: string
    status: string
    notes: string | null
    cost: number | null
    createdAt: Date | string
    flat: { flatNumber: string; flatType: string } | null
    tenant: { fullName: string; phone: string } | null
    building: { name: string } | null
}
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const TABS = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "OPEN" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Resolved", value: "RESOLVED" },
]

const PRIORITY_STYLES: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-orange-100 text-orange-700 border-orange-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-blue-100 text-blue-700 border-blue-200",
}

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
    RESOLVED: "bg-green-100 text-green-700 border-green-200",
    CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
}

const CATEGORY_STYLES: Record<string, string> = {
    Plumbing: "bg-cyan-100 text-cyan-700",
    Electrical: "bg-yellow-100 text-yellow-700",
    Carpentry: "bg-amber-100 text-amber-700",
    Civil: "bg-stone-100 text-stone-700",
    Painting: "bg-indigo-100 text-indigo-700",
}

function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

export function MaintenanceList({ requests }: { requests: MaintenanceRequest[] }) {
    const [activeTab, setActiveTab] = useState("ALL")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const filtered = activeTab === "ALL"
        ? requests
        : requests.filter(r => r.status === activeTab)

    async function handleCreate(formData: FormData) {
        setLoading(true)
        try {
            const result = await createMaintenanceRequest({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                category: formData.get("category") as CreateMaintenanceInput["category"],
                priority: formData.get("priority") as CreateMaintenanceInput["priority"],
                flatId: formData.get("flatNumber") as string,
                buildingId: formData.get("buildingName") as string,
            })
            if (result.success) {
                toast.success("Maintenance request created successfully")
                setDialogOpen(false)
                router.refresh()
            } else {
                toast.error("Failed to create request")
            }
        } catch {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs + Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-md transition whitespace-nowrap",
                                activeTab === tab.value
                                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" />
                            New Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Maintenance Request</DialogTitle>
                            <DialogDescription>
                                Create a new maintenance request for a tenant.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" placeholder="e.g. Leaking faucet" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe the issue..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category" required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                                            <SelectItem value="Electrical">Electrical</SelectItem>
                                            <SelectItem value="Carpentry">Carpentry</SelectItem>
                                            <SelectItem value="Civil">Civil</SelectItem>
                                            <SelectItem value="Painting">Painting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select name="priority" required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="LOW">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="flatNumber">Flat Number</Label>
                                    <Input id="flatNumber" name="flatNumber" placeholder="e.g. A-101" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="buildingName">Building</Label>
                                    <Input id="buildingName" name="buildingName" placeholder="e.g. Sunrise Apt" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Request
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Request Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(req => (
                    <Card key={req.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
                                    {req.title}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className={cn("text-[10px] shrink-0", PRIORITY_STYLES[req.priority])}
                                >
                                    {req.priority}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <Badge variant="outline" className={cn("text-[10px]", CATEGORY_STYLES[req.category] || "")}>
                                    {req.category}
                                </Badge>
                                <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[req.status])}>
                                    {req.status.replace("_", " ")}
                                </Badge>
                            </div>

                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{req.building?.name ?? "—"} • Flat {req.flat?.flatNumber ?? "—"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{req.tenant?.fullName ?? "—"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>{formatDate(req.createdAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                        No maintenance requests found.
                    </div>
                )}
            </div>
        </div>
    )
}
