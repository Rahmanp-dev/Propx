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
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Total Due</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                                {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>₹{payment.totalDue.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-green-600">
                                {payment.amountPaid > 0 ? `₹${payment.amountPaid.toLocaleString('en-IN')}` : '-'}
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
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
