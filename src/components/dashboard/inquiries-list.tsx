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
import { Plus, RefreshCw, Phone, IndianRupee, Calendar, ChevronDown } from "lucide-react"
import { createInquiry, updateInquiryStatus, type CreateInquiryInput } from "@/lib/actions/inquiries"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const SOURCE_STYLES: Record<string, string> = {
    WEBSITE: "bg-blue-100 text-blue-700",
    WALK_IN: "bg-green-100 text-green-700",
    REFERRAL: "bg-purple-100 text-purple-700",
    PHONE: "bg-orange-100 text-orange-700",
    WHATSAPP: "bg-emerald-100 text-emerald-700",
}

const STATUS_STYLES: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700 border-blue-200",
    CONTACTED: "bg-amber-100 text-amber-700 border-amber-200",
    VIEWING_SCHEDULED: "bg-violet-100 text-violet-700 border-violet-200",
    CONVERTED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-gray-100 text-gray-700 border-gray-200",
}

const STATUS_OPTIONS = [
    { label: "New", value: "NEW" },
    { label: "Contacted", value: "CONTACTED" },
    { label: "Viewing Scheduled", value: "VIEWING_SCHEDULED" },
    { label: "Converted", value: "CONVERTED" },
    { label: "Rejected", value: "REJECTED" },
] as const

function formatDate(dateStr: string | Date) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

interface InquiryItem {
    id: string
    name: string
    phone: string
    email?: string | null
    flatType?: string | null
    budget?: number | null
    source: string
    status: string
    notes?: string | null
    message?: string | null
    createdAt: string | Date
    building?: { name: string; address: string } | null
}

function StatusDropdown({ inquiry, onUpdate }: { inquiry: InquiryItem; onUpdate: () => void }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    async function handleStatusChange(newStatus: string) {
        const result = await updateInquiryStatus(inquiry.id, newStatus)
        if (result.success) {
            toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`)
            setOpen(false)
            onUpdate()
            router.refresh()
        } else {
            toast.error((result as any).error || "Failed to update status")
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition",
                    STATUS_STYLES[inquiry.status] || ""
                )}
            >
                {inquiry.status.replace(/_/g, " ")}
                <ChevronDown className="h-3 w-3" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50 py-1">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className={cn(
                                "w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition",
                                inquiry.status === opt.value && "font-bold bg-gray-50 dark:bg-gray-800"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function InquiriesList({ inquiries }: { inquiries: InquiryItem[] }) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [, setRefreshKey] = useState(0)
    const router = useRouter()

    async function handleCreate(formData: FormData) {
        setLoading(true)
        try {
            const data: CreateInquiryInput = {
                name: formData.get("name") as string,
                phone: formData.get("phone") as string,
                email: (formData.get("email") as string) || undefined,
                flatType: (formData.get("flatType") as string) || undefined,
                budget: formData.get("budget") ? parseInt(formData.get("budget") as string, 10) : undefined,
                source: (formData.get("source") as CreateInquiryInput["source"]) || "PHONE",
                notes: (formData.get("notes") as string) || undefined,
            }
            const result = await createInquiry(data)
            if (result.success) {
                toast.success("Inquiry added successfully")
                setDialogOpen(false)
                router.refresh()
            } else {
                toast.error((result as any).error || "Failed to add inquiry")
            }
        } catch {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with add button */}
            <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Inquiry
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Inquiry</DialogTitle>
                            <DialogDescription>
                                Add a new prospective tenant inquiry.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Ankit Mehta" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" placeholder="+91 98765 43210" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input id="email" name="email" type="email" placeholder="email@example.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="flatType">Flat Type</Label>
                                    <Select name="flatType">
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Studio">Studio</SelectItem>
                                            <SelectItem value="1 BHK">1 BHK</SelectItem>
                                            <SelectItem value="2 BHK">2 BHK</SelectItem>
                                            <SelectItem value="3 BHK">3 BHK</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget (₹/month)</Label>
                                    <Input id="budget" name="budget" type="number" placeholder="25000" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select name="source" defaultValue="PHONE">
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEBSITE">Website</SelectItem>
                                        <SelectItem value="WALK_IN">Walk-in</SelectItem>
                                        <SelectItem value="REFERRAL">Referral</SelectItem>
                                        <SelectItem value="PHONE">Phone</SelectItem>
                                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Any additional notes..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Inquiry
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Inquiry Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inquiries.map(inq => (
                    <Card key={inq.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <h3 className="font-semibold text-sm leading-tight flex-1">
                                    {inq.name}
                                </h3>
                                <StatusDropdown
                                    inquiry={inq}
                                    onUpdate={() => setRefreshKey(k => k + 1)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <Badge variant="outline" className={cn("text-[10px]", SOURCE_STYLES[inq.source] || "")}>
                                    {inq.source.replace(/_/g, " ")}
                                </Badge>
                                {inq.flatType && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {inq.flatType}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    <span>{inq.phone}</span>
                                </div>
                                {inq.budget != null && inq.budget > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <IndianRupee className="h-3 w-3 shrink-0" />
                                        <span>₹{inq.budget.toLocaleString()}/month</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>{formatDate(inq.createdAt)}</span>
                                </div>
                            </div>

                            {(inq.notes || inq.message) && (
                                <p className="mt-2 text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md line-clamp-2">
                                    {inq.notes || inq.message}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {inquiries.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                        No inquiries found.
                    </div>
                )}
            </div>
        </div>
    )
}
