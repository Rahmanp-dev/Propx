'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticateScout } from '@/lib/actions/auth'
import { ArrowRight, Phone, Lock, Navigation } from 'lucide-react'

export default function ScoutLoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticateScout, undefined)

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
                        <Navigation className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
                        Scout Portal
                    </h2>
                    <p className="mt-2 text-sm text-indigo-200/60">
                        Log in to track your leads and commissions
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-8 shadow-2xl backdrop-blur-xl sm:px-10">
                        <form action={dispatch} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-indigo-200/80">
                                        Phone Number
                                    </label>
                                    <div className="relative mt-1 rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Phone className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            required
                                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="Enter 10-digit number"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="pin" className="block text-sm font-medium text-indigo-200/80">
                                        4-Digit PIN
                                    </label>
                                    <div className="relative mt-1 rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Lock className="h-5 w-5 text-indigo-400/50" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="pin"
                                            name="pin"
                                            type="password"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            maxLength={4}
                                            required
                                            className="block w-full rounded-lg border border-white/10 bg-slate-950/50 py-3 pl-10 pr-3 text-white placeholder-indigo-200/30 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                            placeholder="••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <LoginButton />
                            </div>

                            <div
                                className="flex min-h-[24px] items-end space-x-1"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {errorMessage && (
                                    <p className="text-sm font-medium text-red-500 text-center w-full">{errorMessage}</p>
                                )}
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
            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? 'Logging in...' : 'Sign In'}
            {!pending && <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
        </button>
    )
}
