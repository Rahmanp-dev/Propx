"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Shield, Zap, Crown, Building2, ArrowLeft, ArrowRight, HelpCircle, Menu, Gift } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'

const CYCLE_MONTHS: Record<BillingCycle, number> = { MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12 }

const BILLING_OPTIONS: { key: BillingCycle; label: string; savings?: string }[] = [
  { key: "MONTHLY", label: "Monthly" },
  { key: "QUARTERLY", label: "Quarterly", savings: "Save 10%" },
  { key: "HALF_YEARLY", label: "Half-Yearly", savings: "Save 15%" },
  { key: "YEARLY", label: "Yearly", savings: "Save 17%" },
]

const CYCLE_LABEL: Record<BillingCycle, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  HALF_YEARLY: "half-year",
  YEARLY: "year",
}

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    icon: Gift,
    description: "Get started with basic property management. No credit card required.",
    prices: { MONTHLY: 0, QUARTERLY: 0, HALF_YEARLY: 0, YEARLY: 0 },
    maxUnits: 7,
    maxBuildings: "1",
    features: [
      "Up to 7 rental units",
      "1 building",
      "Automated rent invoicing",
      "Tenant payment portal",
      "WhatsApp notifications",
      "Maintenance & inquiry desk",
      "Advanced financial insights",
      "24/7 priority support"
    ],
    color: "from-emerald-600 to-green-600",
    shadow: "shadow-emerald-500/10",
    badge: "Free Forever"
  },
  {
    id: "STARTER",
    name: "Starter",
    icon: Zap,
    description: "For individual property owners managing small portfolios.",
    prices: { MONTHLY: 499, QUARTERLY: 1349, HALF_YEARLY: 2549, YEARLY: 4999 },
    maxUnits: 15,
    maxBuildings: "1",
    features: [
      "Up to 15 rental units",
      "1 building",
      "Automated rent invoicing",
      "Tenant payment portal",
      "WhatsApp notifications",
      "Maintenance & inquiry desk",
      "Advanced financial insights",
      "24/7 priority support"
    ],
    color: "from-blue-600 to-indigo-600",
    shadow: "shadow-blue-500/10",
    badge: "For Beginners"
  },
  {
    id: "BUILDER",
    name: "Builder",
    icon: Shield,
    description: "Perfect for growing portfolios with automated management.",
    prices: { MONTHLY: 1199, QUARTERLY: 3249, HALF_YEARLY: 6149, YEARLY: 11999 },
    maxUnits: 40,
    maxBuildings: "3",
    features: [
      "Up to 40 rental units",
      "Up to 3 buildings",
      "Automated rent invoicing",
      "Tenant payment portal",
      "WhatsApp notifications",
      "Maintenance & inquiry desk",
      "Advanced financial insights",
      "24/7 priority support"
    ],
    color: "from-violet-600 to-fuchsia-600",
    shadow: "shadow-violet-500/15",
    badge: "Most Popular",
    popular: true
  },
  {
    id: "PORTFOLIO",
    name: "Portfolio",
    icon: Crown,
    description: "Designed for large property groups and real estate agencies.",
    prices: { MONTHLY: 2499, QUARTERLY: 6749, HALF_YEARLY: 12749, YEARLY: 24999 },
    maxUnits: "Unlimited",
    maxBuildings: "Unlimited",
    features: [
      "Unlimited rental units",
      "Unlimited buildings",
      "Automated rent invoicing",
      "Tenant payment portal",
      "WhatsApp notifications",
      "Maintenance & inquiry desk",
      "Advanced financial insights",
      "24/7 priority support"
    ],
    color: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/15",
    badge: "Enterprise"
  }
]

const FEATURE_COMPARISON = [
  { category: "Usage", name: "Maximum Units Allowed", free: "7 units", starter: "15 units", builder: "40 units", portfolio: "Unlimited" },
  { category: "Usage", name: "Buildings Support", free: "1 Building", starter: "1 Building", builder: "Up to 3", portfolio: "Unlimited" },
  { category: "Automation", name: "Automated Rent Invoicing", free: true, starter: true, builder: true, portfolio: true },
  { category: "Automation", name: "Tenant Mobile Portal", free: true, starter: true, builder: true, portfolio: true },
  { category: "Automation", name: "WhatsApp Notification Engine", free: "Included", starter: "Included", builder: "Included", portfolio: "Included" },
  { category: "Financials", name: "Rent & Deposit Ledger", free: true, starter: true, builder: true, portfolio: true },
  { category: "Financials", name: "UPI Payment Verifications", free: "Included", starter: "Included", builder: "Included", portfolio: "Included" },
  { category: "Operations", name: "Maintenance Desk", free: true, starter: true, builder: true, portfolio: true },
  { category: "Operations", name: "Visitor Logs / Inquiries", free: true, starter: true, builder: true, portfolio: true },
  { category: "Customization", name: "Custom Business Settings", free: true, starter: true, builder: true, portfolio: true },
  { category: "Customization", name: "White-label Invoices", free: true, starter: true, builder: true, portfolio: true },
  { category: "Support", name: "Customer Support Tier", free: "Priority", starter: "Priority", builder: "Priority", portfolio: "Priority" }
]

function renderCellValue(value: boolean | string) {
  if (typeof value === "boolean") {
    return value
      ? <Check className="h-5 w-5 text-emerald-400 mx-auto" />
      : <X className="h-5 w-5 text-slate-600 mx-auto" />
  }
  return value
}

export default function PackagesPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('YEARLY')

  return (
    <div className="dark min-h-screen bg-[#030712] text-white font-sans overflow-x-hidden selection:bg-violet-500/30 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-10 left-10 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-[#030712]/60 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Company Logo" className="h-11 w-11 rounded-lg object-contain bg-white/10 p-0.5" />
            <span className="text-xl font-bold tracking-tight text-white">
              Prop<span className="text-violet-400">X</span>
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/10">
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Nav */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-slate-300">
              Sign In
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-slate-300 hover:text-white">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#030712] border-l-white/10 text-white">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="flex flex-col gap-6 mt-8">
                  <Link href="/" className="text-lg font-medium text-slate-300">Home</Link>
                  <Link href="/login" className="text-lg font-medium text-slate-300">Sign In</Link>
                  <div className="h-px bg-white/10 w-full my-2" />
                  <Link href="/register" className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-base font-bold bg-violet-600 text-white shadow-lg shadow-violet-500/10">
                    Start Free Trial
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <span className="inline-flex items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
            Simple &amp; Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Choose the perfect plan for your portfolio
          </h1>
          <p className="text-lg text-slate-400">
            Automate tenant tracking, WhatsApp notifications, rent collection, and meter billing. Upgrade or downgrade anytime.
          </p>

          {/* Billing Cycle Toggle — 4 options */}
          <div className="pt-6 flex justify-center">
            <div className="bg-[#0f172a] border border-white/5 rounded-full p-1 flex items-center shadow-inner flex-wrap justify-center gap-1">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setBillingCycle(opt.key)}
                  className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    billingCycle === opt.key
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                  {opt.savings && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      billingCycle === opt.key
                        ? "bg-white/20 text-white"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {opt.savings}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-24">
          {PLANS.map((plan) => {
            const isFree = plan.id === "FREE"
            const price = plan.prices[billingCycle]
            const monthlyEquivalent = billingCycle !== "MONTHLY" && !isFree
              ? Math.round(price / CYCLE_MONTHS[billingCycle])
              : null
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/30 p-6 relative ${
                  plan.popular ? "border-violet-500/50 ring-2 ring-violet-500/20" : ""
                } ${plan.shadow}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 px-4 py-1 text-xs font-bold tracking-wide shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {!plan.popular && plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-white/5 px-3 py-0.5 text-[10px] font-semibold">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="pt-4 pb-2">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="flex-1 flex flex-col justify-between mt-4 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-baseline">
                      {isFree ? (
                        <span className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold">₹{price.toLocaleString('en-IN')}</span>
                          <span className="text-slate-400 text-sm ml-2">
                            /{CYCLE_LABEL[billingCycle]}
                          </span>
                        </>
                      )}
                    </div>
                    {monthlyEquivalent !== null && (
                      <p className="text-xs text-emerald-400 font-medium">
                        Equivalent to ₹{monthlyEquivalent.toLocaleString('en-IN')}/month
                      </p>
                    )}
                    {isFree && (
                      <p className="text-xs text-emerald-400 font-medium">
                        No credit card required
                      </p>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">What&apos;s Included</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isFree ? (
                    <Link
                      href="/register?plan=FREE"
                      className="w-full h-11 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-300 mt-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                      Start Free <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <Link
                      href={`/register?plan=${plan.id}&cycle=${billingCycle}`}
                      className={`w-full h-11 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-300 mt-6 ${
                        plan.popular
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
                          : "bg-[#1e293b] hover:bg-[#334155] text-white border border-white/5"
                      }`}
                    >
                      Get Started <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mt-20">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold">Compare Features in Detail</h2>
            <p className="text-slate-400">Every tool you need to run property operations seamlessly.</p>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#0f172a]/40 backdrop-blur-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/80">
                  <th className="p-4 font-semibold text-slate-300 text-sm">Feature Desk</th>
                  <th className="p-4 font-semibold text-sm text-center w-36 text-emerald-400">Free</th>
                  <th className="p-4 font-semibold text-sm text-center w-36 text-slate-300">Starter</th>
                  <th className="p-4 font-semibold text-sm text-center w-36 text-violet-400">Builder</th>
                  <th className="p-4 font-semibold text-sm text-center w-36 text-amber-400">Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((feature, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-300">
                      <div>
                        <p>{feature.name}</p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{feature.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-center text-slate-400">
                      {renderCellValue(feature.free)}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-400">
                      {renderCellValue(feature.starter)}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-200">
                      {renderCellValue(feature.builder)}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-100 font-medium">
                      {renderCellValue(feature.portfolio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <span className="inline-flex items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-slate-400">Get answers to common pricing and plan details.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400 shrink-0" />
                Can I upgrade or downgrade my plan later?
              </h3>
              <p className="text-sm text-slate-400 pl-7 leading-relaxed">
                Yes, absolutely! You can upgrade your plan instantly at any time to unlock more property units or advanced features. Downgrades will take effect at the end of your billing cycle.
              </p>
            </div>
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400 shrink-0" />
                Is there a limit on how many buildings I can create?
              </h3>
              <p className="text-sm text-slate-400 pl-7 leading-relaxed">
                The Free and Starter plans allow 1 building, Builder allows up to 3 buildings, and the Portfolio plan offers unlimited buildings.
              </p>
            </div>
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400 shrink-0" />
                How does the WhatsApp notification engine work?
              </h3>
              <p className="text-sm text-slate-400 pl-7 leading-relaxed">
                On all plans, our engine automatically triggers monthly rent invoice messages, receipt confirmations, and pending reminders to your tenants via WhatsApp API, directly from your customized dashboard, limited only by your plan&apos;s building and unit counts.
              </p>
            </div>
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400 shrink-0" />
                What payment methods are supported?
              </h3>
              <p className="text-sm text-slate-400 pl-7 leading-relaxed">
                Currently, we accept subscription payments via UPI. Simply scan or copy the UPI ID during signup, make the payment, upload a screenshot, and your account will be active within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-[#030712] py-12 mt-32 text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} PropX. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
