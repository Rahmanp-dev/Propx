import { getBuildingsForReceipts, getMonthlyReceipts } from "@/lib/actions/receipts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PrintReceiptsButton } from "@/components/dashboard/print-receipts-button"
import { WhatsAppButton } from "@/components/dashboard/whatsapp-button"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

export default async function ReceiptsPage({ params, searchParams }: { params: Promise<{ userId: string }>, searchParams: Promise<{ buildingId?: string, month?: string, year?: string }> }) {
    const { userId } = await params
    const resolvedSearchParams = await searchParams
    
    const { data: buildings } = await getBuildingsForReceipts()

    const today = new Date()
    const selectedMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : today.getMonth() + 1
    const selectedYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : today.getFullYear()
    const selectedBuildingId = resolvedSearchParams.buildingId

    let receipts = null
    let error = null
    
    if (selectedBuildingId) {
        const result = await getMonthlyReceipts(selectedBuildingId, selectedMonth, selectedYear)
        if (result.data) {
            receipts = result.data
        } else {
            error = result.error
        }
    }

    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

    return (
        <div className="space-y-6">
            <div className="print:hidden flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices & Receipts</h1>
                    <p className="text-muted-foreground">Generate PDFs and send WhatsApp reminders for dues.</p>
                </div>
                {receipts && receipts.length > 0 && (
                    <PrintReceiptsButton />
                )}
            </div>

            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle>Filter Ledger</CardTitle>
                    <CardDescription>Select a building and month to generate documents</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col sm:flex-row gap-4 sm:items-end">
                        <div className="space-y-1.5 flex-1 w-full">
                            <label className="text-sm font-medium">Building</label>
                            <select name="buildingId" defaultValue={selectedBuildingId || ""} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm" required>
                                <option value="" disabled>Select building...</option>
                                {buildings?.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 w-full sm:w-32">
                            <label className="text-sm font-medium">Month</label>
                            <select name="month" defaultValue={selectedMonth} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                                {months.map(m => (
                                    <option key={m} value={m}>{format(new Date(2000, m - 1), "MMMM")}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 w-full sm:w-24">
                            <label className="text-sm font-medium">Year</label>
                            <select name="year" defaultValue={selectedYear} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <Button type="submit" className="w-full sm:w-auto mt-2 sm:mt-0">Generate</Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <div className="print:hidden p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                </div>
            )}

            {receipts && receipts.length === 0 && (
                <div className="print:hidden text-center py-12 text-muted-foreground border rounded-md border-dashed">
                    No payments found for the selected criteria.
                </div>
            )}

            {/* Print Grid: 3 columns, max 3 rows per page = 9 receipts per page */}
            {receipts && receipts.length > 0 && (
                <div id="receipts-container" className="print:block grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max print:grid-cols-3 print:gap-[4mm] print:w-[210mm] print:page-break-inside-avoid">
                    {receipts.map((payment: any, idx: number) => {
                        const org = payment.flat.building.organization
                        const hasNextPage = (idx + 1) % 9 === 0 && idx !== receipts.length - 1
                        const isPending = payment.balance > 0
                        
                        return (
                            <div 
                                key={payment.id} 
                                className={`border border-gray-300 rounded p-3 bg-white flex flex-col justify-between ${hasNextPage ? 'print:break-after-page' : 'print:break-inside-avoid'} print:h-[90mm] print:w-[65mm]`}
                            >
                                <div>
                                    <div className="flex justify-between items-start border-b border-gray-200 pb-2 mb-2">
                                        <div className="overflow-hidden">
                                            <h2 className="text-xs font-bold uppercase truncate">{org?.name || "Property Mgmt"}</h2>
                                            <p className="text-[9px] text-gray-500 truncate">{payment.flat.building.name}</p>
                                        </div>
                                        <div className="text-right whitespace-nowrap pl-2">
                                            <h3 className={`font-bold text-[10px] ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                                                {isPending ? 'INVOICE' : 'RECEIPT'}
                                            </h3>
                                            <p className="text-[8px] text-gray-500">#{payment.id.slice(-5).toUpperCase()}</p>
                                        </div>
                                    </div>

                                    <div className="mb-2 space-y-0.5 text-[9px]">
                                        <p className="flex justify-between"><span className="text-gray-500">Tenant:</span> <span className="font-semibold truncate max-w-[90px] text-right">{payment.tenant.fullName}</span></p>
                                        <p className="flex justify-between"><span className="text-gray-500">Flat:</span> <span className="font-semibold">{payment.flat.flatNumber}</span></p>
                                        <p className="flex justify-between"><span className="text-gray-500">Month:</span> <span className="font-semibold">{format(new Date(payment.month), "MMM yyyy")}</span></p>
                                        <p className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-semibold">{payment.paymentDate ? format(new Date(payment.paymentDate), "dd/MM/yy") : format(new Date(), "dd/MM/yy")}</span></p>
                                    </div>

                                    <div className="w-full rounded border border-gray-100 mb-2">
                                        <table className="w-full text-[9px]">
                                            <thead className="bg-gray-50 border-b border-gray-100 text-[8px]">
                                                <tr>
                                                    <th className="text-left py-1 px-1.5 font-medium">Item</th>
                                                    <th className="text-right py-1 px-1.5 font-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                <tr>
                                                    <td className="py-1 px-1.5">Rent</td>
                                                    <td className="py-1 px-1.5 text-right">₹{payment.rentDue.toLocaleString()}</td>
                                                </tr>
                                                {(payment.maintenanceDue || 0) > 0 && (
                                                    <tr>
                                                        <td className="py-1 px-1.5">Maint.</td>
                                                        <td className="py-1 px-1.5 text-right">₹{payment.maintenanceDue.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {(payment.electricityDue || 0) > 0 && (
                                                    <tr>
                                                        <td className="py-1 px-1.5">Elec.</td>
                                                        <td className="py-1 px-1.5 text-right">₹{payment.electricityDue.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                                {(payment.customDues || 0) > 0 && (
                                                    <tr>
                                                        <td className="py-1 px-1.5">Other</td>
                                                        <td className="py-1 px-1.5 text-right">₹{payment.customDues.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-medium border-t border-gray-100">
                                                <tr>
                                                    <td className="py-1 px-1.5 text-[8px] text-green-700">Paid</td>
                                                    <td className="py-1 px-1.5 text-right text-[8px] text-green-700">₹{payment.amountPaid.toLocaleString()}</td>
                                                </tr>
                                                {payment.balance > 0 && (
                                                    <tr>
                                                        <td className="py-1 px-1.5 text-[9px] text-amber-600 font-bold">Pending</td>
                                                        <td className="py-1 px-1.5 text-right text-[9px] text-amber-600 font-bold">₹{payment.balance.toLocaleString()}</td>
                                                    </tr>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-gray-100">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[8px] text-gray-500 max-w-[60%]">
                                            <p>Mode: <span className="font-medium text-gray-700">{payment.paymentMethod || 'N/A'}</span></p>
                                            {payment.upiReference && <p className="truncate">UPI: {payment.upiReference}</p>}
                                            {payment.notes && <p className="truncate mt-0.5"><span className="font-medium text-gray-700">Remarks:</span> {payment.notes}</p>}
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 border-b border-gray-400 mb-0.5 h-4"></div>
                                            <p className="text-[7px] text-gray-500">{isPending ? 'Due Date: 5th' : 'Signature'}</p>
                                        </div>
                                    </div>
                                    <div className="pdf-hide">
                                        <WhatsAppButton 
                                            paymentId={payment.id} 
                                            phone={payment.tenant.phone} 
                                            type={isPending ? 'INVOICE' : 'RECEIPT'} 
                                            tenantName={payment.tenant.fullName}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
