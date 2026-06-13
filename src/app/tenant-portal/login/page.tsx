"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { RefreshCw, ArrowRight, ArrowLeft, Phone, Lock } from "lucide-react"
import { authenticateTenant } from "@/lib/actions/tenant-auth"
import Link from "next/link"

export default function TenantLoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticateTenant, undefined)

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
            {/* Top navigation bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="h-9 w-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        <img src="/logo.png" alt="PropX" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-lg font-bold text-white">
                        Prop<span className="text-blue-400">X</span>
                    </span>
                </Link>
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-sm text-blue-300/70 hover:text-blue-300 transition-colors font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Home
                </Link>
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center px-5 py-10">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white">Tenant Portal</h1>
                        <p className="text-sm text-blue-200/60 mt-1">Sign in to manage your rental</p>
                    </div>

                    {/* Form card */}
                    <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-2xl shadow-black/30">
                        <form action={dispatch} className="space-y-5">
                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium text-blue-200/70 block">
                                    Phone Number
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-blue-300/60 bg-white/5 border border-white/10 px-3 py-3 rounded-lg shrink-0">+91</span>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/40" />
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="98480 12345"
                                            required
                                            maxLength={10}
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            className="h-12 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-white placeholder:text-blue-300/30 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PIN */}
                            <div className="space-y-2">
                                <label htmlFor="pin" className="text-sm font-medium text-blue-200/70 block">
                                    Login PIN
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/40" />
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="password"
                                        placeholder="• • • •"
                                        required
                                        maxLength={4}
                                        inputMode="numeric"
                                        autoComplete="current-password"
                                        className="h-12 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-white text-xl tracking-[0.5em] placeholder:text-blue-300/30 placeholder:tracking-normal focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                                    />
                                </div>
                                <p className="text-xs text-blue-300/40 text-center">
                                    🔑 Usually the last 4 digits of your phone number
                                </p>
                            </div>

                            <LoginButton />

                            {/* Error */}
                            <div
                                className="flex min-h-[20px] items-center justify-center"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {errorMessage && (
                                    <p className="text-center text-sm font-medium text-red-400">
                                        {errorMessage}
                                    </p>
                                )}
                            </div>

                            {/* Owner login link */}
                            <div className="text-center pt-1">
                                <Link
                                    href="/login"
                                    className="text-xs text-blue-300/50 hover:text-blue-300 transition-colors"
                                >
                                    Are you a property owner? Sign in →
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="group w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
        >
            {pending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
            )}
        </button>
    )
}
