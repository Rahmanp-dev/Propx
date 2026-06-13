import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react'

export default async function ScoutDashboardOverview() {
    const session = await auth()
    const user = session?.user as any
    if (!session || user?.role !== 'SCOUT') {
        redirect('/scout-portal/login')
    }

    const scoutId = user.id

    const scout = await prisma.scout.findUnique({
        where: { id: scoutId },
        include: {
            leads: {
                orderBy: { createdAt: 'desc' },
                take: 20
            }
        }
    })

    if (!scout) {
        redirect('/scout-portal/login')
    }

    const totalLeads = scout.leads.length
    const pendingLeads = scout.leads.filter(l => l.status === 'PENDING').length
    const convertedLeads = scout.leads.filter(l => l.status === 'CONVERTED').length

    return (
        <div className="p-4 space-y-6">
            <div className="pt-2">
                <h2 className="text-xl font-bold text-white">Hello, {scout.name.split(' ')[0]} 👋</h2>
                <p className="text-sm text-indigo-200/60">Here is your field performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-200/50 uppercase tracking-wider">Total Leads</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{totalLeads}</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-indigo-200/50 uppercase tracking-wider">Converted</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{convertedLeads}</span>
                </div>
            </div>

            {/* Recent Leads */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Recent Logged Visits</h3>
                </div>

                {scout.leads.length === 0 ? (
                    <div className="rounded-xl border border-white/5 border-dashed p-8 text-center bg-white/[0.01]">
                        <p className="text-sm text-indigo-200/50">You haven't logged any visits yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scout.leads.map(lead => (
                            <div key={lead.id} className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-indigo-100">{lead.buildingName}</h4>
                                    <StatusBadge status={lead.status} />
                                </div>
                                <p className="text-sm text-indigo-200/70">{lead.ownerName} • {lead.ownerPhone}</p>
                                <p className="text-xs text-indigo-200/40 mt-2">{new Date(lead.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'CONVERTED') {
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">Converted</span>
    }
    if (status === 'REJECTED') {
        return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 ring-1 ring-inset ring-red-500/20">Rejected</span>
    }
    if (status === 'CONTACTED') {
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">Contacted</span>
    }
    return <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">Pending</span>
}
