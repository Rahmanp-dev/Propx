"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { createBuilding } from "@/lib/actions/building"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"
import { Separator } from "@/components/ui/separator"

export function AddBuildingDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(createBuildingSchema),
        defaultValues: {
            name: "",
            address: "",
            totalFloors: 1,
            defaultRentBHK1: 8000,
            defaultRentBHK2: 12000,
            defaultRentBHK3: 16000,
            ratePerUnit: 10,
        },
    })

    async function onSubmit(values: CreateBuildingInput) {
        setLoading(true)
        setError("")
        try {
            const result = await createBuilding(values)
            setLoading(false)

            if (result.success) {
                toast.success("Building created successfully!")
                setOpen(false)
                form.reset()
                router.refresh()
            } else {
                console.error("Server Action returned error:", result.error)
                setError(result.error || "Failed to create building")
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Building
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Building</DialogTitle>
                    <DialogDescription>
                        Enter building details. Floors will be auto-generated.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Building Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Galaxy Apartments" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="totalFloors"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Floors</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as number} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ratePerUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Elec. Rate (₹/Unit)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.5" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />
                        <p className="text-sm font-medium text-muted-foreground">Default Rent Structure</p>

                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border">
                            <FormField
                                control={form.control}
                                name="defaultRentBHK1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">1 BHK (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="defaultRentBHK2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">2 BHK (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="defaultRentBHK3"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">3 BHK (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={(field.value as any) ?? ''} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Building"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
