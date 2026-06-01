"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, RefreshCw } from "lucide-react"
import { submitMaintenanceRequest } from "@/lib/actions/tenant-portal"

export function NewMaintenanceForm({ tenantId }: { tenantId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [category, setCategory] = useState("")
    const [priority, setPriority] = useState("MEDIUM")
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await submitMaintenanceRequest(tenantId, {
                category,
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                priority,
            })
            if (result.success) {
                setOpen(false)
                setCategory("")
                setPriority("MEDIUM")
                router.refresh()
            } else {
                alert(result.error || "Failed to submit")
            }
        } catch {
            alert("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-1 h-4 w-4" />
                    New Request
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>New Maintenance Request</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PLUMBING">Plumbing</SelectItem>
                                <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                                <SelectItem value="CARPENTRY">Carpentry</SelectItem>
                                <SelectItem value="PAINTING">Painting</SelectItem>
                                <SelectItem value="CLEANING">Cleaning</SelectItem>
                                <SelectItem value="PEST_CONTROL">Pest Control</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Kitchen sink leaking" required className="h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Describe the issue in detail..."
                            required
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={loading || !category} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
