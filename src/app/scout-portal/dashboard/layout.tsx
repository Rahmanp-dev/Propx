import { ReactNode } from 'react'
import Link from 'next/link'
import { Navigation, Calculator, ListPlus, LogOut, LayoutDashboard } from 'lucide-react'
import { handleSignOut } from '@/lib/actions/auth'

export default function ScoutDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen flex-col bg-slate-950 text-white overflow-hidden pb-16">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                        <Navigation className="h-4 w-4 text-white" />
                    </div>
                    <h1 className="text-lg font-bold">Scout Portal</h1>
                </div>
                <form action={handleSignOut.bind(null, '/scout-portal/login')}>
                    <button type="submit" className="flex items-center justify-center rounded-full p-2 text-indigo-300 hover:bg-white/5 transition">
                        <LogOut className="h-5 w-5" />
                    </button>
                </form>
            </header>

            {/* Main Content Scrollable Area */}
            <main className="flex-1 overflow-y-auto w-full">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 z-40 flex h-16 w-full items-center justify-around border-t border-white/10 bg-slate-950/90 backdrop-blur-lg">
                <NavItem href="/scout-portal/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/scout-portal/dashboard/log-visit" icon={ListPlus} label="Log Visit" />
                <NavItem href="/scout-portal/dashboard/calculator" icon={Calculator} label="Calculator" />
            </nav>
        </div>
    )
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center space-y-1 text-indigo-200/50 hover:text-indigo-400 transition-colors py-2 px-4">
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
        </Link>
    )
}
