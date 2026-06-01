"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Phone, KeyRound, RefreshCw, ArrowRight } from "lucide-react"
import { loginTenant } from "@/lib/tenant-auth"

export default function TenantLoginPage() {
    const [phone, setPhone] = useState('')
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleLogin() {
        setError('')
        setLoading(true)
        try {
            const result = await loginTenant(phone, pin)
            if (result.success) {
                router.push('/tenant-portal/dashboard')
                router.refresh()
            } else {
                setError(result.error || 'Login failed')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="text-3xl font-bold text-gray-900">PropX</div>
                    <CardTitle className="text-lg font-normal text-muted-foreground">
                        Tenant Portal
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground bg-gray-100 px-3 py-2 rounded-md border border-gray-300">+91</span>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="98480 12345"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="flex-1 h-11 border-gray-300 dark:border-gray-700"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pin">Login PIN</Label>
                        <Input
                            id="pin"
                            type="text"
                            placeholder="Enter 4-digit PIN"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="h-12 text-center text-xl tracking-[0.5em] border-gray-300 dark:border-gray-700"
                            maxLength={4}
                            inputMode="numeric"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            🔑 Your PIN is provided by your landlord
                        </p>
                    </div>

                    <Button
                        onClick={handleLogin}
                        disabled={loading || phone.length < 10 || pin.length < 4}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Login
                    </Button>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="text-center pt-2">
                        <a
                            href="/login"
                            className="text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                            Are you an admin? Login here →
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
