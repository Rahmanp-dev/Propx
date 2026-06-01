import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar"
import { SuperAdminMobileSidebar } from "@/components/layout/super-admin-mobile-sidebar"

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Only SUPER_ADMIN role can access
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
        redirect('/login')
    }

    return (
        <div className="h-full relative">
            {/* Desktop Sidebar */}
            <div className="hidden h-full md:flex md:w-[280px] md:flex-col md:fixed md:inset-y-0 z-[80]">
                <SuperAdminSidebar user={session?.user} />
            </div>
            <main className="md:pl-[280px] min-h-screen bg-gray-50/80">
                {/* Desktop Top Bar */}
                <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
                    <div>
                        <p className="text-sm text-gray-500">
                            Welcome back, <span className="font-semibold text-gray-900">{(session?.user as any)?.name || 'Admin'}</span>
                        </p>
                    </div>
                </header>
                {/* Mobile Header */}
                <div className="flex items-center p-4 border-b border-gray-200 h-16 bg-white md:hidden sticky top-0 z-50">
                    <SuperAdminMobileSidebar user={session?.user} />
                    <span className="font-bold ml-4 text-gray-900">PropX Admin</span>
                </div>
                <div className="p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
