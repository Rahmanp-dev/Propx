import { getFinanceStats } from "@/lib/actions/finance"
import { getPendingVerifications } from "@/lib/actions/payment-proof"
import { GenerateDuesButton } from "@/components/dashboard/generate-dues-button"
import { FinanceCharts } from "@/components/dashboard/finance-charts"
import { PendingVerifications } from "./pending-verifications"

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const [{ data, error }, verificationsResult] = await Promise.all([
        getFinanceStats(),
        getPendingVerifications(),
    ])

    if (error || !data) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-2xl font-bold text-red-500">Error loading finance data</div>
                <p className="text-muted-foreground">Could not fetch financial data.</p>
                {error && <pre className="text-xs bg-slate-100 p-4 rounded-lg">{error}</pre>}
            </div>
        )
    }

    const pendingProofs = verificationsResult?.data || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Command Center</h1>
                    <p className="text-muted-foreground">Real-time financial overview across all properties</p>
                </div>
                <GenerateDuesButton />
            </div>

            {/* Pending Verifications Section */}
            {pendingProofs.length > 0 && (
                <PendingVerifications proofs={pendingProofs} />
            )}

            <FinanceCharts data={data} />
        </div>
    )
}
