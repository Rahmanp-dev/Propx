'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { registerOrganization, uploadSubscriptionProof } from '@/lib/actions/registration'
import {
  Building2, User, Mail, Phone, Lock, MapPin, Check,
  ChevronRight, ChevronLeft, Upload, CreditCard, Zap,
  Shield, Crown, Loader2, CheckCircle2, Copy, ArrowRight,
  ShieldCheck, BarChart3, Users
} from 'lucide-react'
import Link from 'next/link'

// ─── Plan Data ───────────────────────────────────────────
const PLANS = [
  {
    id: 'STARTER' as const,
    name: 'Starter',
    icon: Zap,
    description: 'Perfect for individual property owners',
    monthlyPrice: 499,
    annualPrice: 4999,
    maxUnits: 20,
    features: ['Up to 20 units', 'Tenant management', 'Rent collection', 'Basic reports', 'WhatsApp notifications'],
    color: 'from-blue-500 to-blue-600',
    badge: null,
  },
  {
    id: 'BUILDER' as const,
    name: 'Builder',
    icon: Shield,
    description: 'For growing property portfolios',
    monthlyPrice: 1199,
    annualPrice: 11999,
    maxUnits: 60,
    features: ['Up to 60 units', 'Everything in Starter', 'Advanced analytics', 'Maintenance tracking', 'Multi-building support', 'Priority support'],
    color: 'from-indigo-500 to-violet-600',
    badge: 'Popular',
  },
  {
    id: 'PORTFOLIO' as const,
    name: 'Portfolio',
    icon: Crown,
    description: 'For large-scale property management',
    monthlyPrice: 2499,
    annualPrice: 24999,
    maxUnits: 999,
    features: ['Unlimited units', 'Everything in Builder', 'Custom branding', 'API access', 'Dedicated account manager', 'Custom reports'],
    color: 'from-fuchsia-500 to-pink-600',
    badge: 'Enterprise',
  },
]

type PlanType = 'STARTER' | 'BUILDER' | 'PORTFOLIO'
type BillingCycle = 'MONTHLY' | 'ANNUAL'

const featuresList = [
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

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: Owner details
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('Hyderabad')

  // Step 2: Plan
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BUILDER')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('ANNUAL')
  const [businessName, setBusinessName] = useState('')

  // Step 3: Payment
  const [orgId, setOrgId] = useState('')
  const [amount, setAmount] = useState(0)
  const [upiId, setUpiId] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleStep1 = () => {
    setError('')
    if (!ownerName.trim()) return setError('Please enter your name')
    if (!email.trim()) return setError('Please enter your email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email')
    if (!phone.trim() || phone.length < 10) return setError('Please enter a valid phone number')
    if (!password || password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')
    setStep(2)
  }

  const handleStep2 = () => {
    setError('')
    if (!businessName.trim()) return setError('Please enter your business/property name')
    setStep(3)
    handleRegister()
  }

  const handleRegister = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await registerOrganization({
        ownerName,
        businessName,
        email,
        phone,
        city,
        plan: selectedPlan,
        billingCycle,
        password,
      })

      if (!result.success) {
        setError(result.error || 'Registration failed')
        setStep(2)
        setIsLoading(false)
        return
      }

      setOrgId(result.organizationId!)
      setAmount(result.amount!)
      setUpiId(result.upiId!)
    } catch {
      setError('Something went wrong. Please try again.')
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshotFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setScreenshotPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUploadProof = async () => {
    if (!screenshotFile) return setError('Please upload payment screenshot')
    setUploading(true)
    setError('')

    try {
      // Upload file first
      const formData = new FormData()
      formData.append('file', screenshotFile)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadData.url) {
        setError('File upload failed')
        setUploading(false)
        return
      }

      // Submit proof
      const result = await uploadSubscriptionProof(orgId, {
        screenshotUrl: uploadData.url,
        upiTransactionId: utrNumber || undefined,
      })

      if (result.success) {
        setStep(4)
      } else {
        setError(result.error || 'Failed to submit proof')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="dark flex min-h-screen w-full bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* ── Left Branding Panel ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between border-r border-white/5 bg-slate-950">
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
            <Link href="/" className="mb-6 flex items-center gap-3 w-fit">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Prop<span className="text-indigo-400">X</span>
              </span>
            </Link>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
              Join the future of{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Property Management.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-indigo-200/70">
              Set up your account in minutes and automate your property portfolio operations today.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            {featuresList.map((feature) => (
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
      <div className="flex w-full items-center justify-center px-4 py-8 lg:w-1/2 lg:px-8 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-lg pb-12">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden mt-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Prop<span className="text-indigo-400">X</span>
              </span>
            </Link>
          </div>

          <div className="border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/20 backdrop-blur-xl rounded-2xl p-6 md:p-8">
            
            {/* Step Progress Header */}
            <div className="mb-8 flex flex-col items-center">
              <div className="flex items-center justify-center w-full max-w-xs mx-auto">
                {[1, 2, 3, 4].map((s, index) => (
                  <div key={s} className="flex items-center w-full last:w-auto">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        step >= s
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-800 text-slate-500 border border-white/5'
                      }`}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 4 && (
                      <div
                        className={`h-0.5 w-full mx-1 rounded transition-all duration-300 ${
                          step > s ? 'bg-indigo-500/50' : 'bg-slate-800'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-indigo-400 mt-4 text-center">
                {step === 1 && 'Create your account'}
                {step === 2 && 'Choose your plan'}
                {step === 3 && 'Complete payment'}
                {step === 4 && 'All set!'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                <div className="shrink-0 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            {/* ─── STEP 1: Owner Details ─── */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="text"
                        placeholder="Rajesh Kumar"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="tel"
                        placeholder="9848012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="email"
                        placeholder="rajesh@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="text"
                        placeholder="Hyderabad"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200/70">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                      <input
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleStep1}
                    className="group relative h-11 w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/30 text-sm flex items-center justify-center gap-2"
                  >
                    Continue to Plan
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>
                
                <p className="text-center text-sm text-indigo-200/50 pt-2">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                    Log in
                  </Link>
                </p>
              </div>
            )}

            {/* ─── STEP 2: Plan Selection ─── */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-200/70">Business / Portfolio Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                    <input
                      type="text"
                      placeholder="e.g. Limra Pasha Residency"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Billing toggle */}
                <div className="flex justify-center pt-2">
                  <div className="bg-slate-950/40 rounded-full p-1 border border-white/10 flex items-center">
                    <button
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                        billingCycle === 'MONTHLY'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-indigo-200/50 hover:text-indigo-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('ANNUAL')}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                        billingCycle === 'ANNUAL'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-indigo-200/50 hover:text-indigo-200'
                      }`}
                    >
                      Annual
                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px] border border-emerald-500/20">
                        Save 17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plan cards list */}
                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice
                    const isSelected = selectedPlan === plan.id
                    const Icon = plan.icon

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative cursor-pointer transition-all duration-200 rounded-xl p-4 border flex items-center gap-4 ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isSelected ? plan.color : 'from-slate-700 to-slate-800'} flex items-center justify-center shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">{plan.name}</h3>
                            {plan.badge && (
                              <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-indigo-200/50 mt-0.5 leading-snug">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-white">₹{price.toLocaleString()}</span>
                          <p className="text-[10px] text-indigo-300/40">/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="h-11 px-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-1/3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStep2}
                    disabled={isLoading}
                    className="h-11 flex-1 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Payment ─── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Amount Summary */}
                <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-indigo-300">
                      {PLANS.find(p => p.id === selectedPlan)?.name} Plan ({billingCycle.toLowerCase()})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">₹{amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* UPI Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-200/70">1. Pay via UPI</label>
                  <div className="bg-slate-950/40 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/5 mb-3">
                      <span className="font-mono font-semibold text-white text-sm">{upiId}</span>
                      <button
                        onClick={copyUpi}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-200/50 leading-relaxed">
                      Send exactly <strong className="text-indigo-300">₹{amount.toLocaleString()}</strong> to the UPI ID above using any UPI app (GPay, PhonePe, Paytm), and take a screenshot of the successful transaction.
                    </p>
                  </div>
                </div>

                {/* Upload Screenshot */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-200/70">2. Upload Payment Proof</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      screenshotPreview
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                    }`}
                  >
                    {screenshotPreview ? (
                      <div className="space-y-3">
                        <img
                          src={screenshotPreview}
                          alt="Payment proof"
                          className="max-h-32 mx-auto rounded-lg shadow-lg border border-white/10"
                        />
                        <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded successfully
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="h-5 w-5 text-indigo-400" />
                        </div>
                        <p className="text-sm text-indigo-200 font-medium">Click to upload screenshot</p>
                        <p className="text-xs text-indigo-300/40">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-200/70">3. UTR Number (Optional)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/40" />
                    <input
                      type="text"
                      placeholder="12 digit UTR / Ref Number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/40 pl-10 pr-4 text-white placeholder:text-indigo-300/30 transition-all duration-200 focus:border-indigo-500/50 focus:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="h-11 px-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-1/3"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUploadProof}
                    disabled={uploading || !screenshotFile}
                    className="h-11 flex-1 overflow-hidden rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 4: Success ─── */}
            {step === 4 && (
              <div className="text-center animate-in zoom-in-95 duration-500 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Registration Complete!</h2>
                  <p className="text-indigo-200/70 text-sm max-w-sm mx-auto leading-relaxed">
                    Your details and payment proof have been received. We'll verify your transaction and activate your account.
                  </p>
                </div>
                <div className="bg-slate-950/40 rounded-xl p-5 text-left border border-white/5 space-y-4">
                  <h3 className="font-semibold text-indigo-300 text-sm border-b border-white/5 pb-2">Next Steps</h3>
                  <ul className="space-y-3 text-sm text-indigo-200/70">
                    <li className="flex items-start gap-3">
                      <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] flex-shrink-0 font-bold border border-indigo-500/20">1</span>
                      <span className="mt-0.5">Admin verifies payment proof</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] flex-shrink-0 font-bold border border-indigo-500/20">2</span>
                      <span className="mt-0.5">Account activated (usually within 12h)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] flex-shrink-0 font-bold border border-indigo-500/20">3</span>
                      <span className="mt-0.5">Log in and setup your properties</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="h-11 w-full rounded-lg bg-white hover:bg-indigo-50 font-semibold text-indigo-900 transition-colors text-sm"
                  >
                    Go to Login Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
