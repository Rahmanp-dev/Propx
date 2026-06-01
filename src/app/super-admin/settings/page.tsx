import { getPlatformSettings } from "@/lib/actions/super-admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Key } from "lucide-react"
import { SettingsForm } from "./settings-form"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const result = await getPlatformSettings()

    const settings = result.success ? result.data : { upiId: '' }

    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8">Platform Settings</h2>

            <div className="grid gap-6 max-w-2xl">
                {/* UPI Configuration */}
                <SettingsForm initialUpiId={settings?.upiId || ''} />

                {/* Admin Credentials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Admin Credentials
                        </CardTitle>
                        <CardDescription>
                            Super admin login credentials are configured via environment variables
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium">Admin Email</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <Badge variant="secondary">ADMIN_EMAIL</Badge>
                                    <span className="ml-2 text-xs">Environment variable</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Admin Password</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <Badge variant="secondary">ADMIN_PASSWORD</Badge>
                                    <span className="ml-2 text-xs">Environment variable</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-800 text-sm">
                                <Shield className="h-4 w-4" />
                                <span className="font-medium">Security Note</span>
                            </div>
                            <p className="text-xs text-amber-700 mt-1">
                                Admin credentials are stored as environment variables (ADMIN_EMAIL, ADMIN_PASSWORD) in your .env file.
                                To change them, update the environment variables and restart the server.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
