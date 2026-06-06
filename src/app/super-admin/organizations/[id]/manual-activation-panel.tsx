"use client"

import { useState } from "react"
import { manualActivateOrganization } from "@/lib/actions/super-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Shield, CheckCircle, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function ManualActivationPanel({
    orgId,
    planStatus,
}: {
    orgId: string
    planStatus: string
}) {
    const router = useRouter()
    const [billingCycle, setBillingCycle] = useState("MONTHLY")
    const [activating, setActivating] = useState(false)
    const [activationMessage, setActivationMessage] = useState("")

    if (planStatus !== 'PENDING_PAYMENT' && planStatus !== 'EXPIRED') {
        return null
    }

    async function handleManualActivate() {
        setActivating(true)
        setActivationMessage("")
        const result = await manualActivateOrganization(orgId, billingCycle)
        if (result.success) {
            setActivationMessage("Organization activated successfully!")
            router.refresh()
        } else {
            setActivationMessage(result.error || "Failed to activate organization")
        }
        setActivating(false)
    }

    return (
        <Card className="border-indigo-200 shadow-sm overflow-hidden mb-8">
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
    )
}
