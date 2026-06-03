"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Shield, Zap, Crown, Building2, ArrowLeft, ArrowRight, HelpCircle, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    icon: Zap,
    description: "Ideal for individual property owners managing small assets.",
    monthlyPrice: 499,
    annualPrice: 4999,
    maxUnits: 20,
    features: [
      "Up to 20 rental units",
      "Tenant database",
      "Manual rent tracking",
      "Standard PDF receipts",
      "Basic WhatsApp logs",
      "Community support"
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
    monthlyPrice: 1199,
    annualPrice: 11999,
    maxUnits: 60,
    features: [
      "Up to 60 rental units",
      "Everything in Starter",
      "Automated rent dues engine",
      "Tenant payment portal",
      "Meter readings & bills calc",
      "Instant WhatsApp notifications",
      "Maintenance ticket system",
      "Priority email support"
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
    monthlyPrice: 2499,
    annualPrice: 24999,
    maxUnits: "Unlimited",
    features: [
      "Unlimited rental units",
      "Everything in Builder",
      "Custom business branding",
      "Multi-owner account delegation",
      "Advanced financial insights",
      "Custom excel/csv reports",
      "Dedicated account manager",
      "24/7 priority phone support"
    ],
    color: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/15",
    badge: "Enterprise"
  }
]

const FEATURE_COMPARISON = [
  { category: "Usage", name: "Maximum Units Allowed", starter: "20 units", builder: "60 units", portfolio: "Unlimited" },
  { category: "Usage", name: "Buildings Support", starter: "Single Building", builder: "Multiple Buildings", portfolio: "Unlimited" },
  { category: "Automation", name: "Automated Rent Invoicing", starter: false, builder: true, portfolio: true },
  { category: "Automation", name: "Tenant Mobile Portal", starter: false, builder: true, portfolio: true },
  { category: "Automation", name: "WhatsApp Notification Engine", starter: "Manual", builder: "Automated", portfolio: "Automated + Custom Templates" },
  { category: "Financials", name: "Rent & Deposit Ledger", starter: true, builder: true, portfolio: true },
  { category: "Financials", name: "UPI Payment Verifications", starter: "Manual Approval Only", builder: "UTR Upload Auto-Matching", portfolio: "Instant Automated Reconciliation" },
  { category: "Operations", name: "Maintenance Desk", starter: false, builder: true, portfolio: true },
  { category: "Operations", name: "Visitor Logs / Inquiries", starter: true, builder: true, portfolio: true },
  { category: "Customization", name: "Custom Business Settings", starter: false, builder: true, portfolio: true },
  { category: "Customization", name: "White-label Invoices", starter: false, builder: false, portfolio: true },
  { category: "Support", name: "Customer Support Tier", starter: "Email (48h)", builder: "Priority Email (6h)", portfolio: "Dedicated Phone Manager" }
]

export default function PackagesPage() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL")

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
            <img src="/logo.png" alt="Company Logo" className="h-9 w-9 rounded-lg object-contain bg-white/5" />
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
            Simple & Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Choose the perfect plan for your portfolio
          </h1>
          <p className="text-lg text-slate-400">
            Automate tenant tracking, WhatsApp notifications, rent collection, and meter billing. Upgrade or downgrade anytime.
          </p>

          {/* Pricing Toggle */}
          <div className="pt-6 flex justify-center">
            <div className="bg-[#0f172a] border border-white/5 rounded-full p-1 flex items-center shadow-inner">
              <button
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === "MONTHLY"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle("ANNUAL")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === "ANNUAL"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Annual Billing
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch mb-24">
          {PLANS.map((plan) => {
            const price = billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.annualPrice
            const monthlyEquivalent = billingCycle === "ANNUAL" ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
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
                      <span className="text-4xl font-extrabold">₹{price.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        /{billingCycle === "MONTHLY" ? "month" : "year"}
                      </span>
                    </div>
                    {billingCycle === "ANNUAL" && (
                      <p className="text-xs text-emerald-400 font-medium">
                        Equivalent to ₹{monthlyEquivalent.toLocaleString()}/month
                      </p>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">What's Included</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href={`/register?plan=${plan.id}&cycle=${billingCycle}`} className={`w-full h-11 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-300 mt-6 ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
                      : "bg-[#1e293b] hover:bg-[#334155] text-white border border-white/5"
                  }`}>
                    Get Started <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
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
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f172a]/80">
                  <th className="p-4 font-semibold text-slate-300 text-sm">Feature Desk</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm text-center w-48">Starter</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm text-center w-48 text-violet-400">Builder</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm text-center w-48 text-amber-400">Portfolio</th>
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
                      {typeof feature.starter === "boolean" ? (
                        feature.starter ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                      ) : (
                        feature.starter
                      )}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-200">
                      {typeof feature.builder === "boolean" ? (
                        feature.builder ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                      ) : (
                        feature.builder
                      )}
                    </td>
                    <td className="p-4 text-sm text-center text-slate-100 font-medium">
                      {typeof feature.portfolio === "boolean" ? (
                        feature.portfolio ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-5 w-5 text-slate-600 mx-auto" />
                      ) : (
                        feature.portfolio
                      )}
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
                The Starter plan is capped at a single building to keep things clean. The Builder and Portfolio plans support multiple and unlimited buildings respectively.
              </p>
            </div>
            <div className="space-y-2.5">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-violet-400 shrink-0" />
                How does the WhatsApp notification engine work?
              </h3>
              <p className="text-sm text-slate-400 pl-7 leading-relaxed">
                On the Builder and Portfolio plans, our engine automatically triggers monthly rent invoice messages, receipt confirmations, and pending reminders to your tenants via WhatsApp API, directly from your customized dashboard.
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
