import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { auth } from "@/lib/auth"
import { GlobalSearch } from "@/components/dashboard/global-search"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { AlertTriangle, CreditCard, ShieldAlert } from "lucide-react"
import { BILLING_CYCLE_LABELS, PRICING, generateUpiIntentLink } from "@/lib/plan-guard"

import { PushNotificationPrompt } from "@/components/dashboard/push-notification-prompt"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const user = session?.user as any
    const firstName = user?.name?.split(" ")[0] ?? "there"

    // ═══ PLAN STATUS CHECK ═══
    let planWarning: { type: 'expired' | 'suspended' | 'pending' | 'expiring_soon'; message: string; upiLink?: string } | null = null

    if (user?.organizationId && user?.role !== 'SUPER_ADMIN') {
        const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: {
                plan: true,
                planStatus: true,
                billingCycle: true,
                isActive: true,
                isSuspended: true,
                subscriptionEnd: true,
            },
        })

        if (org) {
            const now = new Date()
            const isExpired = org.plan !== 'FREE' && org.subscriptionEnd ? org.subscriptionEnd < now : false
            const platformUpiId = process.env.PLATFORM_UPI_ID || 'propx@upi'
            const pricing = PRICING[org.plan]?.[org.billingCycle]
            const upiLink = pricing ? generateUpiIntentLink({
                upiId: platformUpiId,
                amount: pricing.amount,
                plan: org.plan,
                billingCycle: org.billingCycle,
            }) : ''

            if (org.isSuspended) {
                planWarning = {
                    type: 'suspended',
                    message: 'Your account has been suspended. Please contact support to resolve this.',
                }
            } else if (isExpired) {
                planWarning = {
                    type: 'expired',
                    message: `Your ${org.plan} plan has expired. Renew now to continue managing your properties.`,
                    upiLink,
                }
            } else if (org.planStatus === 'PENDING_PAYMENT') {
                planWarning = {
                    type: 'pending',
                    message: 'Your account is pending payment verification. Complete your payment to activate full access.',
                    upiLink,
                }
            } else if (org.subscriptionEnd && org.plan !== 'FREE') {
                const daysLeft = Math.ceil((org.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                if (daysLeft <= 7 && daysLeft > 0) {
                    planWarning = {
                        type: 'expiring_soon',
                        message: `Your plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to avoid service interruption.`,
                        upiLink,
                    }
                }
            }
        }
    }

    // Full-screen block for expired/suspended/pending
    const isBlocked = planWarning?.type === 'expired' || planWarning?.type === 'suspended' || planWarning?.type === 'pending'

    return (
        <div className="h-full relative">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
                <Sidebar user={user} />
            </aside>

            {/* ── Main Content Area ── */}
            <div className="md:pl-72 min-h-screen flex flex-col bg-gray-50/50">
                {/* ── Mobile Header ── */}
                <header className="flex items-center gap-3 px-4 h-14 border-b border-gray-200/80 bg-white md:hidden sticky top-0 z-50">
                    <MobileSidebar user={user} />
                    <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex-1">
                        PropX
                    </span>
                    <GlobalSearch />
                </header>

                {/* ── Desktop Top Bar ── */}
                <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
                    <div>
                        <h2 className="text-sm font-medium text-gray-500">
                            Welcome back,{" "}
                            <span className="text-gray-900 font-semibold">
                                {firstName}
                            </span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <GlobalSearch />
                        {user?.email && (
                            <p className="text-xs text-gray-400 font-medium tracking-wide border-l pl-4 border-gray-200">
                                {user.email}
                            </p>
                        )}
                    </div>
                </header>

                {/* ── Plan Warning Banners ── */}
                {planWarning && !isBlocked && (
                    <div className={`px-4 py-3 flex items-center gap-3 text-sm font-medium border-b ${
                        planWarning.type === 'expiring_soon' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{planWarning.message}</span>
                        {planWarning.upiLink && (
                            <a
                                href={planWarning.upiLink}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0"
                            >
                                <CreditCard className="h-3.5 w-3.5" />
                                Renew Now
                            </a>
                        )}
                    </div>
                )}
                
                {/* ── Push Notification Prompt ── */}
                {!isBlocked && (
                    <PushNotificationPrompt />
                )}

                {/* ── Page Content (or Blocked Screen) ── */}
                {isBlocked ? (
                    <main className="flex-1 flex items-center justify-center p-8">
                        <div className="max-w-md text-center space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                                <ShieldAlert className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {planWarning?.type === 'suspended' ? 'Account Suspended' : planWarning?.type === 'pending' ? 'Payment Verification Pending' : 'Subscription Expired'}
                            </h1>
                            <p className="text-gray-500 leading-relaxed">
                                {planWarning?.message}
                            </p>
                            {planWarning?.upiLink && (
                                <a
                                    href={planWarning.upiLink}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <CreditCard className="h-5 w-5" />
                                    Pay & Renew Subscription
                                </a>
                            )}
                            <p className="text-xs text-gray-400">
                                Need help? Contact support at support@propx.in
                            </p>
                        </div>
                    </main>
                ) : (
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                )}
            </div>
        </div>
    )
}
