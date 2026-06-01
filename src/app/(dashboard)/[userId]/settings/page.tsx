import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, IndianRupee } from 'lucide-react'
import { WhatsAppSettingsSection } from '@/components/settings/whatsapp-settings'
import { getOrgWhatsAppConfig, getOwnerPaymentConfig } from '@/lib/actions/settings'
import { PaymentConfigForm } from './payment-config-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const [waStatus, payConfig] = await Promise.all([
        getOrgWhatsAppConfig(),
        getOwnerPaymentConfig(),
    ])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your PropX configuration</p>
            </div>

            <div className="space-y-6">
                {/* Payment Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Payment Collection Settings
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Configure how tenants pay you. These details are shown on tenant payment pages.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <PaymentConfigForm initialData={payConfig?.data || null} />
                    </CardContent>
                </Card>

                {/* WhatsApp */}
                <WhatsAppSettingsSection
                    configured={waStatus.configured}
                    maskedToken={waStatus.maskedToken}
                    phoneNumberId={waStatus.phoneNumberId}
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            General Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            More configuration options coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
