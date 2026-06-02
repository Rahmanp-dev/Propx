"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus, CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { onboardTenant } from "@/lib/actions/tenant"
import { onboardTenantSchema, OnboardTenantInput } from "@/lib/validations"

interface OnboardTenantDialogProps {
    flatId: string
    suggestedRent: number
    suggestedDeposit: number
}

export function OnboardTenantDialog({ flatId, suggestedRent, suggestedDeposit }: OnboardTenantDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(onboardTenantSchema),
        defaultValues: {
            flatId: flatId,
            fullName: "",
            phone: "",
            aadhaarNumber: "",
            occupantsCount: 1,
            leaseStartDate: new Date(),
            rentAmount: suggestedRent,
            depositAmount: suggestedDeposit,
            initialMeterReading: 0
        },
    })

    async function onSubmit(values: OnboardTenantInput) {
        setLoading(true)
        setError("")
        try {
            const result = await onboardTenant(values)
            setLoading(false)

            if (result.success) {
                setOpen(false)
                form.reset()
                router.refresh()
            } else {
                console.error("Server Action returned error:", result.error)
                setError(result.error || "Failed to onboard tenant")
            }
        } catch (err) {
            setLoading(false)
            console.error("Fetch/Network error:", err)
            setError("An unexpected error occurred. Please check your connection.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Onboard Tenant
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Onboard New Tenant</DialogTitle>
                    <DialogDescription>
                        Enter tenant details to start the lease.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="9876543210" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="aadhaarNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aadhaar / ID Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="XXXX-XXXX-XXXX" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="leaseStartDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Lease Start Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="occupantsCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Occupants</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                            <FormField
                                control={form.control}
                                name="rentAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agreed Rent (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="depositAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deposit Amount (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="initialMeterReading"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Initial Meter Reading</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 0 or 1000" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Onboarding..." : "Complete Onboarding"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
