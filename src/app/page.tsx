import Link from "next/link"
import { Building2, Shield, Zap, MessageSquare, CreditCard, ArrowRight, CheckCircle, BarChart3, Users, Wrench, Globe, Smartphone, Lock } from "lucide-react"
import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: Building2,
    title: "Unified Property Management",
    description: "Manage buildings, rooms, and flats inside a clean hierarchical workspace. Set specific configurations, check occupancy, and manage assets dynamically.",
    color: "from-blue-500 to-sky-500"
  },
  {
    icon: Zap,
    title: "Automated Rent Engine",
    description: "Generate monthly rent, utility bills, and maintenance dues automatically on the 1st of every month. No manual entries required.",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp API Engine",
    description: "Send professional automated PDF invoices, rent receipts, payment reminders, and custom templates straight to your tenants' WhatsApp numbers.",
    color: "from-emerald-500 to-green-500"
  },
  {
    icon: CreditCard,
    title: "Seamless UPI Payments",
    description: "Enable tenants to make direct UPI payments through their custom portal. UTR transaction matching reduces reconciliation workload by 90%.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Wrench,
    title: "Maintenance Helpdesk",
    description: "Let tenants raise maintenance tickets with photo uploads. Assign tickets to staff, monitor progress, and notify tenants on updates.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Get real-time insights on expected vs. collected revenue, outstanding dues, occupant ratios, and growth trends with intuitive visual charts.",
    color: "from-cyan-500 to-teal-500"
  }
]

export default async function LandingPage() {
  const session = await auth()
  const user = session?.user

  return (
    <div className="dark min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Glowing backdrop orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute top-[30%] right-[10%] h-[700px] w-[700px] rounded-full bg-indigo-600/10 blur-[160px]" />
        <div className="absolute bottom-[20%] left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[140px]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/60 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Prop<span className="text-indigo-400">X</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Platform</a>
            <Link href="/packages" className="hover:text-white transition-colors">Packages & Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link href={(user as any).role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : `/${user.id}/dashboard`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 transition-all">
                  Register Now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-28 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          The Operating System for Property Portfolios
        </div>

        <h1 className="max-w-5xl mx-auto text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Manage rentals, billing, and tenants from{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            One Dashboard.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed font-medium">
          PropX streamlines invoice generation, UPI reconciliation, maintenance tickets, and client outreach via WhatsApp. Designed for modern real estate builders and portfolio owners.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={user ? ((user as any).role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : `/${user.id}/dashboard`) : "/register"} className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-500/25 transition-all text-base group">
            {user ? "Go to Dashboard" : "Get Started Today"} 
            <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/packages" className="inline-flex items-center justify-center h-14 px-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-base">
            View Packages
          </Link>
        </div>
        
        {/* Trust metrics */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/5 mt-12">
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-white">99%</h3>
            <p className="text-sm text-slate-500 font-medium">Uptime SLA</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-white">256-bit</h3>
            <p className="text-sm text-slate-500 font-medium">Encryption</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-white">24/7</h3>
            <p className="text-sm text-slate-500 font-medium">System Monitoring</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-white">100%</h3>
            <p className="text-sm text-slate-500 font-medium">Automated Billing</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Component / Visual Showcase */}
      <section id="dashboard-preview" className="relative z-10 max-w-6xl mx-auto px-6 pb-24 md:pb-36">
        <div className="relative border border-white/10 bg-slate-900/60 rounded-2xl p-4 md:p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
          {/* Top border ambient glow */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Window Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-slate-600/40" />
            <span className="h-3 w-3 rounded-full bg-slate-600/40" />
            <span className="h-3 w-3 rounded-full bg-slate-600/40" />
            <span className="ml-4 text-xs font-mono text-slate-500">PropX Portfolio Management System Workspace</span>
          </div>

          {/* High Fidelity Screen Mockup */}
          <div className="grid grid-cols-12 gap-6 bg-slate-950/90 rounded-xl p-4 md:p-6 border border-white/5 text-left">
            {/* Sidebar Mockup */}
            <div className="hidden lg:block col-span-3 border-r border-white/5 pr-4 space-y-4">
              <div className="flex items-center gap-3 px-2 py-2 bg-white/5 rounded-lg border border-white/5">
                <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20">PX</div>
                <div>
                  <h4 className="text-xs font-bold text-white">PropX Portfolio</h4>
                  <p className="text-[10px] text-slate-500">Limra Residency</p>
                </div>
              </div>
              <div className="space-y-1">
                {["Dashboard", "Buildings", "Tenants", "Finance", "WhatsApp", "Maintenance"].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${i === 0 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <span className={`h-4 w-4 rounded-sm flex items-center justify-center text-[10px] ${i === 0 ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>{item.slice(0, 1)}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard Workspace Mockup */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Workspace Overview</h2>
                  <p className="text-xs text-slate-400 mt-1">Overview of Limra Pasha portfolio</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">Live Sync</span>
                </div>
              </div>

              {/* Statistics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Collection Rate", value: "94.6%", desc: "₹3,45,000 Expected", color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                  { label: "Occupied Units", value: "88%", desc: "44 of 50 flats active", color: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-500/10" },
                  { label: "Active Dues", value: "₹18,500", desc: "4 pending payments", color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" }
                ].map((stat, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${stat.border} ${stat.bg} backdrop-blur-sm`}>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl font-extrabold ${stat.color} mt-2`}>{stat.value}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Main content split */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Building detail cards */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Active Properties</h4>
                    <span className="text-xs text-indigo-400 cursor-pointer hover:underline">View All</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "Limra Pasha Tower A", units: "24 units", rate: "92% Occupied" },
                      { name: "Pasha Palace Annex", units: "16 units", rate: "84% Occupied" }
                    ].map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg hover:border-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{b.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{b.units}</p>
                        </div>
                        <span className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-md font-semibold">{b.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Outreach Monitor */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">WhatsApp Hub</h4>
                    <span className="text-xs text-indigo-400 cursor-pointer hover:underline">Open Inbox</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { tenant: "Karthik Verma (A-402)", type: "Rent Invoice PDF", status: "Delivered", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                      { tenant: "Sophia John (B-105)", type: "Payment Confirmed", status: "Sent", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-lg hover:border-white/10 transition-colors text-xs">
                        <div>
                          <p className="text-sm font-semibold text-slate-300">{m.tenant}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.type}</p>
                        </div>
                        <span className={`text-[10px] ${m.color} ${m.bg} ${m.border} border px-2 py-1 rounded-md font-semibold`}>{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5 bg-slate-950">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="inline-flex items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 tracking-wider uppercase">
            Powerful Modules
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Everything you need to scale
          </h2>
          <p className="text-lg text-slate-400 font-medium">
            Ditch messy excel sheets and manual payment reminders. PropX automates the entire property lifecycle from onboarding to rent collection.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="group p-8 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Seamless Workflow Section (Replaces Old Audiences/Sample Login) */}
      <section id="workflow" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 tracking-wider uppercase">
                Seamless Workflow
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                One platform. <br/> Connected portals.
              </h2>
              <p className="text-slate-400 text-lg font-medium">
                PropX acts as the central operational bridge between landlords and tenants. Secure, real-time, and built for modern demands.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              {[
                { 
                  icon: Globe,
                  title: "Owner Workspace", 
                  desc: "A powerful desktop-first dashboard to manage properties, generate rent, track meters, and configure WhatsApp APIs." 
                },
                { 
                  icon: Smartphone,
                  title: "Tenant Mobile Portal", 
                  desc: "Tenants log into a secure, mobile-friendly portal to view active dues, submit payment proof, and track maintenance." 
                },
                { 
                  icon: Lock,
                  title: "Bank-Grade Security", 
                  desc: "End-to-end encryption on all tenant data and financial records. Nightly backups ensure you never lose your ledger." 
                }
              ].map((benefit, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-colors">
                    <benefit.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{benefit.title}</h4>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed font-medium">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 rounded-3xl space-y-8 shadow-2xl shadow-violet-950/20 text-center overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Shield className="w-64 h-64 text-violet-500" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Built for Scale</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Whether you manage 10 units or 10,000, PropX scales effortlessly. Skip the manual data entry and let our automation engine handle your month-end billing cycles.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                <div>
                  <h4 className="text-3xl font-extrabold text-white">90%</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">Less Admin Time</p>
                </div>
                <div>
                  <h4 className="text-3xl font-extrabold text-white">3x</h4>
                  <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">Faster Collections</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="p-8 md:p-16 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-slate-900 to-indigo-950/80 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-indigo-600/10 to-violet-600/10 opacity-50" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Ready to automate your properties?
            </h2>
            <p className="text-indigo-200/70 text-md md:text-lg font-medium">
              Set up your account in minutes. Automate rent, message your tenants via WhatsApp, and keep your balances perfect.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-white text-indigo-950 font-bold shadow-xl shadow-white/10 transition-all text-base hover:bg-slate-100">
                Get Started Today
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center h-14 px-10 rounded-xl text-white border border-white/20 hover:bg-white/10 font-bold transition-all text-base">
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950 py-12 mt-12 text-center text-sm text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} PropX. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
