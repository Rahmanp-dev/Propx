import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { auth } from "@/lib/auth"
import { GlobalSearch } from "@/components/dashboard/global-search"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const user = session?.user
    const firstName = user?.name?.split(" ")[0] ?? "there"

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

                {/* ── Page Content ── */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
