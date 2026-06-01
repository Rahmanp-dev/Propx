'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions/auth'
import { Building2, ShieldCheck, BarChart3, Users, ArrowRight, Lock, Mail } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with end-to-end encryption.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Real-time insights and comprehensive reporting dashboards.',
  },
  {
    icon: Users,
    title: 'Tenant Management',
    description: 'Streamlined tenant onboarding, communication, and tracking.',
  },
]

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined)

  return (
    <div className="dark flex min-h-screen w-full overflow-x-hidden bg-slate-950 text-white">
      {/* ── Left Branding Panel ── */}
      <div className="relative hidden lg:w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between border-r border-white/5 bg-slate-950">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-20">
          {/* Logo & tagline */}
          <div className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Prop<span className="text-indigo-400">X</span>
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
              Property Management,{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-indigo-200/70">
              A modern platform to manage properties, tenants, and finances — all
              from one powerful dashboard.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors duration-300 group-hover:from-indigo-500/20 group-hover:to-violet-500/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-indigo-200/50">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="relative z-10 px-12 pb-8 xl:px-20">
          <p className="text-xs text-indigo-300/30">
            © {new Date().getFullYear()} PropX. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-12 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Prop<span className="text-indigo-400">X</span>
            </span>
          </div>

          <form action={dispatch} className="w-full">
            <div className="border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-8 space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="text-sm text-indigo-200/50">
                  Sign in to your account to continue
                </p>
              </div>

              <div className="space-y-5">
                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-indigo-200/70 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-indigo-200/70">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-indigo-400/70 transition-colors duration-200 hover:text-indigo-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <LoginButton />

                {/* Error message */}
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

                {/* Divider */}
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                </div>

                {/* Register link */}
                <p className="text-center text-sm text-indigo-200/50">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="font-semibold text-indigo-400 transition-colors duration-200 hover:text-indigo-300"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </form>
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
      className="group relative h-11 w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Signing in…
        </>
      ) : (
        <>
          Sign In
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  )
}
