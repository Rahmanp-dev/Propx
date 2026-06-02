'use client'

import { useState } from 'react'
import { updateTenantDetails, EditTenantInput } from '@/lib/actions/tenant-edit'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Edit } from "lucide-react"

interface EditTenantDialogProps {
    tenant: {
        id: string
        fullName: string
        phone: string
        email?: string | null
        aadhaarNumber?: string | null
        occupantsCount: number
        emergencyContact?: string | null
        paymentMethodId?: string | null
        notes?: string | null
    }
    paymentMethods?: { id: string; label: string; type: string }[]
    children?: React.ReactNode
}

export function EditTenantDialog({ tenant, paymentMethods = [], children }: EditTenantDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState<EditTenantInput>({
        tenantId: tenant.id,
        fullName: tenant.fullName,
        phone: tenant.phone,
        email: tenant.email || '',
        aadhaarNumber: tenant.aadhaarNumber || '',
        occupantsCount: tenant.occupantsCount,
        emergencyContact: tenant.emergencyContact || '',
        paymentMethodId: tenant.paymentMethodId || '',
        notes: tenant.notes || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setFormData(prev => ({ ...prev, [name]: name === 'occupantsCount' ? parseInt(value) : value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await updateTenantDetails(formData)
        if (res.success) {
            toast("Success", { description: "Tenant details updated successfully." })
            setOpen(false)
        } else {
            toast("Error", { description: res.error || "Failed to update tenant" })
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Tenant Details</DialogTitle>
                    <DialogDescription>
                        Update the personal and contact information for {tenant.fullName}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="aadhaarNumber">Aadhaar (Optional)</Label>
                            <Input id="aadhaarNumber" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="occupantsCount">Occupants</Label>
                            <Input id="occupantsCount" name="occupantsCount" type="number" min="1" value={formData.occupantsCount} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
                        <Input id="emergencyContact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
                    </div>
                    {paymentMethods.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Assigned Payment Method</Label>
                            <Select 
                                value={formData.paymentMethodId || "default"} 
                                onValueChange={(val) => setFormData(prev => ({ ...prev, paymentMethodId: val === "default" ? "" : val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Organization Default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Organization Default</SelectItem>
                                    {paymentMethods.map(method => (
                                        <SelectItem key={method.id} value={method.id}>
                                            {method.label} ({method.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
