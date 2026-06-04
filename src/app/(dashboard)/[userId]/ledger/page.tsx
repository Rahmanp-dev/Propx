import { getFlatLedger, getAllFlats, getMasterMonthLedger } from "@/lib/actions/ledger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer } from "lucide-react"

import { PrintLedgerButton } from "@/components/dashboard/print-ledger-button"
import { MonthPicker } from "@/components/dashboard/month-picker"
import { MarkMonthPaidButton } from "@/components/dashboard/mark-month-paid-button"
import { FlatSelector } from "@/components/dashboard/flat-selector"

export const dynamic = 'force-dynamic'

export default async function LedgerPage({ params, searchParams }: { params: Promise<{ userId: string }>, searchParams: Promise<{ flatId?: string, month?: string }> }) {
    const { userId } = await params
    const resolvedSearchParams = await searchParams
    const flatId = resolvedSearchParams.flatId
    const currentMonth = resolvedSearchParams.month || format(new Date(), 'yyyy-MM')
    
    let displayMonth = new Date()
    const parsedDate = new Date(`${currentMonth}-01T00:00:00`)
    if (!isNaN(parsedDate.getTime())) {
        displayMonth = parsedDate
    }

    const { data: flats } = await getAllFlats()
    const { data: masterData } = await getMasterMonthLedger(currentMonth)

    let ledgerData = null
    let flatDetails = null
    if (flatId) {
        const { data } = await getFlatLedger(flatId)
        if (data) {
            ledgerData = data.payments
            flatDetails = data.flat
        }
    }

    // Master Ledger Aggregations
    let totalExpected = 0
    let totalCollected = 0
    let totalPending = 0
    
    if (masterData) {
        masterData.forEach(p => {
            totalExpected += p.totalDue
            totalCollected += p.amountPaid
            totalPending += p.balance
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Property Ledger</h1>
                <p className="text-muted-foreground">View flat-wise payment history and monthly master reports.</p>
            </div>

            <Tabs defaultValue="flat-ledger" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="flat-ledger">Flat-Wise Ledger</TabsTrigger>
                    <TabsTrigger value="master-ledger">Master Monthly Ledger</TabsTrigger>
                </TabsList>

                <TabsContent value="flat-ledger" className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Card className="w-full md:w-1/3 h-fit max-h-[80vh] overflow-y-auto">
                            <CardHeader>
                                <CardTitle>Select Flat</CardTitle>
                                <CardDescription>Choose a flat to view its ledger</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4 md:p-6">
                                <FlatSelector flats={flats || []} flatId={flatId} userId={userId} />
                            </CardContent>
                        </Card>

                        <Card className="w-full md:w-2/3">
                            <CardHeader>
                                <CardTitle>
                                    {flatDetails ? `${flatDetails.building.name} - Flat ${flatDetails.flatNumber}` : "Ledger Details"}
                                </CardTitle>
                                {flatDetails && (
                                    <CardDescription>
                                        Current Tenant: {flatDetails.tenants.length > 0 ? flatDetails.tenants[0].fullName : 'Vacant'}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                {ledgerData ? (
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead>Tenant</TableHead>
                                                    <TableHead className="text-right">Total Due</TableHead>
                                                    <TableHead className="text-right">Paid</TableHead>
                                                    <TableHead className="text-right">Balance</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Date & Method</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ledgerData.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell className="font-medium">
                                                            {format(new Date(payment.month), "MMM yyyy")}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {payment.tenant.fullName}
                                                        </TableCell>
                                                        <TableCell className="text-right">₹{payment.totalDue.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString()}` : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {payment.balance > 0 ? `₹${payment.balance.toLocaleString()}` : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={payment.status === "PAID" ? "default" : (payment.status === "PARTIAL" ? "secondary" : "destructive")}>
                                                                {payment.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {payment.paymentDate ? (
                                                                <>
                                                                    {format(new Date(payment.paymentDate), "dd MMM yy")}
                                                                    <br />
                                                                    <span className="text-muted-foreground">{payment.paymentMethod}</span>
                                                                </>
                                                            ) : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {ledgerData.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No payment records found for this flat.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Select a flat to view its ledger.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="master-ledger">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Master Monthly Ledger</CardTitle>
                                <CardDescription>Overview of all flat payments for {format(displayMonth, 'MMMM yyyy')}</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <MonthPicker currentMonth={currentMonth} />
                                <MarkMonthPaidButton currentMonth={currentMonth} />
                                <PrintLedgerButton 
                                    masterData={masterData || []} 
                                    currentMonth={currentMonth}
                                    totalExpected={totalExpected}
                                    totalCollected={totalCollected}
                                    totalPending={totalPending}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 border rounded-xl bg-gray-50/50">
                                    <p className="text-sm font-medium text-gray-500">Total Expected</p>
                                    <p className="text-2xl font-bold">₹{totalExpected.toLocaleString()}</p>
                                </div>
                                <div className="p-4 border rounded-xl bg-green-50/50">
                                    <p className="text-sm font-medium text-green-600">Total Collected</p>
                                    <p className="text-2xl font-bold text-green-700">₹{totalCollected.toLocaleString()}</p>
                                </div>
                                <div className="p-4 border rounded-xl bg-red-50/50">
                                    <p className="text-sm font-medium text-red-600">Total Pending</p>
                                    <p className="text-2xl font-bold text-red-700">₹{totalPending.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Building</TableHead>
                                            <TableHead>Flat</TableHead>
                                            <TableHead>Tenant</TableHead>
                                            <TableHead className="text-right">Expected</TableHead>
                                            <TableHead className="text-right">Collected</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {masterData?.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">{payment.flat.building.name}</TableCell>
                                                <TableCell>Flat {payment.flat.flatNumber}</TableCell>
                                                <TableCell>{payment.tenant.fullName}</TableCell>
                                                <TableCell className="text-right">₹{payment.totalDue.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {payment.balance > 0 ? `₹${payment.balance.toLocaleString()}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={payment.status === "PAID" ? "default" : (payment.status === "PARTIAL" ? "secondary" : "destructive")}>
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {masterData?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No records found for this month.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
