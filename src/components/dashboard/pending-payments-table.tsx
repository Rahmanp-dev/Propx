"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LogPaymentDialog } from "@/components/dashboard/log-payment-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PendingPaymentsTableProps {
    payments: any[]
    userId: string
}

export function PendingPaymentsTable({ payments, userId }: PendingPaymentsTableProps) {
    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground border rounded-md bg-slate-50">
                No pending payments found. Good job!
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Flat</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                                {payment.tenant.fullName}
                            </TableCell>
                            <TableCell>
                                <Link href={`/${userId}/flats/${payment.flatId}`} className="hover:underline">
                                    {payment.flat.building.name} - {payment.flat.flatNumber}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-red-600 font-bold">
                                ₹{payment.balance.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Badge variant="destructive">
                                    {payment.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <LogPaymentDialog payment={payment} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
