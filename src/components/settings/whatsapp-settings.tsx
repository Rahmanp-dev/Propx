'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Send, Loader2, ExternalLink, Save } from 'lucide-react'
import { testOrgWhatsAppConnection, updateOrgWhatsAppConfig } from '@/lib/actions/settings'

interface WhatsAppSectionProps {
    configured: boolean
    maskedToken: string
    phoneNumberId: string
}

export function WhatsAppSettingsSection({ configured, maskedToken, phoneNumberId: initialPhoneNumberId }: WhatsAppSectionProps) {
    const [phone, setPhone] = useState('')
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isSaving, startSaving] = useTransition()

    const [accessToken, setAccessToken] = useState('')
    const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId || '')
    const [verifyToken, setVerifyToken] = useState('')
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    function handleTest() {
        setResult(null)
        startTransition(async () => {
            const res = await testOrgWhatsAppConnection(phone)
            if (res.success) {
                setResult({ type: 'success', message: `Test message sent! ID: ${res.messageId}` })
            } else {
                setResult({ type: 'error', message: res.error || 'Unknown error' })
            }
        })
    }

    function handleSave() {
        setSaveResult(null)
        startSaving(async () => {
            const res = await updateOrgWhatsAppConfig({ accessToken, phoneNumberId, verifyToken })
            if (res.success) {
                setSaveResult({ type: 'success', message: 'WhatsApp configuration saved successfully.' })
                setAccessToken('') // clear raw token input for security
            } else {
                setSaveResult({ type: 'error', message: res.error || 'Failed to save configuration.' })
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            WhatsApp Business API
                            {configured ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Not Configured</Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Send rent reminders and broadcast messages to tenants via WhatsApp
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Access Token</label>
                        <div className="flex flex-col gap-2">
                            <Input
                                placeholder={maskedToken ? "Update Token (currently set)" : "EAAG..."}
                                value={accessToken}
                                onChange={e => setAccessToken(e.target.value)}
                                disabled={isSaving}
                            />
                            {configured && !accessToken && (
                                <p className="text-xs text-muted-foreground">Current: {maskedToken}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Phone Number ID</label>
                        <Input
                            placeholder="1234567890"
                            value={phoneNumberId}
                            onChange={e => setPhoneNumberId(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Webhook Verify Token (Optional)</label>
                        <Input
                            placeholder="my_custom_verify_token"
                            value={verifyToken}
                            onChange={e => setVerifyToken(e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground">Used to verify webhooks if you want to handle incoming messages.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving || (!accessToken && !configured) || !phoneNumberId} size="sm">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Configuration
                    </Button>
                </div>
                {saveResult && (
                    <p className={`text-sm ${saveResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {saveResult.message}
                    </p>
                )}

                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Test Connection</h4>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Phone number (e.g. 9876543210)"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            disabled={!configured || isPending}
                            className="max-w-xs"
                        />
                        <Button
                            onClick={handleTest}
                            disabled={!configured || !phone.trim() || isPending}
                            size="sm"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Send className="h-4 w-4 mr-1" />
                            )}
                            Send Test
                        </Button>
                    </div>
                    {result && (
                        <p className={`text-sm mt-2 ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.message}
                        </p>
                    )}
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Setup Instructions</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>1. Create an app in the <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Developer Dashboard</a>.</p>
                        <p>2. Add the WhatsApp product to your app.</p>
                        <p>3. Generate a permanent access token and copy your Phone Number ID.</p>
                        <p className="mt-2">
                            <a
                                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                                WhatsApp Cloud API Documentation
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
