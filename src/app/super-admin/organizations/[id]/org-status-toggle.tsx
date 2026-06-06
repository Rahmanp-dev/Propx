"use client"

import { Button } from "@/components/ui/button"
import { toggleOrgStatus } from "@/lib/actions/super-admin"
import { Ban, CheckCircle } from "lucide-react"
import { useTransition, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function OrgStatusToggle({
    orgId,
    isActive,
    isSuspended,
    planStatus,
}: {
    orgId: string
    isActive: boolean
    isSuspended: boolean
    planStatus?: string
}) {
    const [isPending, startTransition] = useTransition()
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleToggle = (action: 'activate' | 'suspend') => {
        startTransition(async () => {
            await toggleOrgStatus(orgId, action)
            setDialogOpen(false)
        })
    }



    if (isSuspended) {
        return (
            <Button
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleToggle('activate')}
                disabled={isPending}
            >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isPending ? 'Activating...' : 'Activate Organization'}
            </Button>
        )
    }

    if (isActive && planStatus !== 'PENDING_PAYMENT' && planStatus !== 'EXPIRED') {
        return (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isPending}
                    >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend Organization
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend Organization</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to suspend this organization? They will lose access to all features until reactivated.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleToggle('suspend')}
                            disabled={isPending}
                        >
                            {isPending ? 'Suspending...' : 'Confirm Suspend'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    // Default
    return null
}
