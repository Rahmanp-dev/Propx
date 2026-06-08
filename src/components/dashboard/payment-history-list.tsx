"use client"

import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LogPaymentDialog } from "@/components/dashboard/log-payment-dialog"

interface PaymentHistoryListProps {
    payments: any[]
}

export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border-dashed border rounded-md">
                No payment history available yet.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Total Due</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Pending</TableHead>
                            <TableHead>Collection Date</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => {
                            const pendingAmount = payment.balance
                            return (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">
                                        {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell>₹{payment.totalDue.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-green-600 font-medium">
                                        {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString('en-IN')}` : '-'}
                                    </TableCell>
                                    <TableCell className={pendingAmount > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                                        {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString('en-IN')}` : '₹0'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {payment.paymentMethod ? (
                                            <Badge variant="outline" className="text-xs">
                                                {payment.paymentMethod}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payment.status === 'PAID' ? 'default' :
                                                payment.status === 'PARTIAL' ? 'secondary' :
                                                    'destructive'
                                        }>
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {payment.status !== 'PAID' && (
                                            <LogPaymentDialog payment={payment} asIcon />
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {payments.map((payment) => {
                    const pendingAmount = payment.balance
                    return (
                        <div key={payment.id} className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {new Date(payment.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {payment.paymentDate ? `Paid on ${new Date(payment.paymentDate).toLocaleDateString()}` : 'No payment date'}
                                    </p>
                                </div>
                                <Badge variant={
                                    payment.status === 'PAID' ? 'default' :
                                        payment.status === 'PARTIAL' ? 'secondary' :
                                            'destructive'
                                }>
                                    {payment.status}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                                <div>
                                    <span className="text-muted-foreground">Total Due:</span>
                                    <p className="font-medium">₹{payment.totalDue.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Amount Paid:</span>
                                    <p className="text-green-600 font-medium">
                                        {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString('en-IN')}` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Pending Balance:</span>
                                    <p className={pendingAmount > 0 ? "text-red-600 font-bold text-lg" : "text-gray-900 font-medium"}>
                                        ₹{pendingAmount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Method:</span>
                                    <p>{payment.paymentMethod || '-'}</p>
                                </div>
                            </div>
                            
                            {payment.status !== 'PAID' && (
                                <div className="pt-2 w-full flex justify-end">
                                    <LogPaymentDialog payment={payment} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
