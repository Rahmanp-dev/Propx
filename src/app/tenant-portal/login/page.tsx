"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RefreshCw, ArrowRight } from "lucide-react"
import { authenticateTenant } from "@/lib/actions/tenant-auth"
import Link from "next/link"

export default function TenantLoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticateTenant, undefined)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
            <Card className="w-full max-w-sm shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-xl shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img src="/logo.png" alt="Company Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">PropX</span>
                    </div>
                    <CardTitle className="text-lg font-normal text-muted-foreground">
                        Tenant Portal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={dispatch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground bg-gray-100 px-3 py-2 rounded-md border border-gray-300">+91</span>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="98480 12345"
                                    required
                                    className="flex-1 h-11 border-gray-300 dark:border-gray-700"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pin">Login PIN</Label>
                            <Input
                                id="pin"
                                name="pin"
                                type="text"
                                placeholder="Enter 4-digit PIN"
                                required
                                className="h-12 text-center text-xl tracking-[0.5em] border-gray-300 dark:border-gray-700"
                                maxLength={4}
                                inputMode="numeric"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                🔑 Your PIN is usually the last 4 digits of your phone number
                            </p>
                        </div>

                        <LoginButton />

                        <div
                            className="flex min-h-[20px] items-center justify-center"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <p className="text-center text-sm font-medium text-red-500">
                                    {errorMessage}
                                </p>
                            )}
                        </div>

                        <div className="text-center pt-2">
                            <Link
                                href="/login"
                                className="text-xs text-muted-foreground hover:text-blue-600 transition-colors"
                            >
                                Are you an owner? Login here →
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
        >
            {pending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Login
        </Button>
    )
}
