"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePlatformSettings } from "@/lib/actions/super-admin"
import { IndianRupee, Save, CheckCircle } from "lucide-react"
import { useState, useTransition } from "react"

export function SettingsForm({ initialUpiId }: { initialUpiId: string }) {
    const [upiId, setUpiId] = useState(initialUpiId)
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        startTransition(async () => {
            const result = await updatePlatformSettings({ upiId })
            if (result.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Payment Configuration
                </CardTitle>
                <CardDescription>
                    Configure the platform UPI ID for receiving subscription payments from organizations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="upiId">Platform UPI ID</Label>
                    <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        This UPI ID is shown to organizations when they make subscription payments.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                    {saved && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Saved successfully
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
