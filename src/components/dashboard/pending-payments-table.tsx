"use client"

import { useState } from "react"
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
    const [showAll, setShowAll] = useState(false)

    if (!payments || payments.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground border rounded-md bg-slate-50">
                No pending payments found. Good job!
            </div>
        )
    }

    const displayPayments = showAll ? payments : payments.slice(0, 5)
    const hasMore = payments.length > 5

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-x-auto overflow-y-auto max-h-[400px]">
                <Table className="relative">
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
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
                        {displayPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell className="font-medium">
                                    {payment.tenant.fullName}
                                </TableCell>
                                <TableCell>
                                    <Link href={`/${userId}/flats/${payment.flatId}`} className="hover:underline text-blue-600">
                                        {payment.flat.building.name} - {payment.flat.flatNumber}
                                    </Link>
                                    {payment.flat.floor?.number !== undefined && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                            (Floor {payment.flat.floor.number})
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="text-red-600 font-bold">
                                    ₹{payment.balance.toLocaleString('en-IN')}
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {displayPayments.map((payment) => (
                    <div key={payment.id} className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-900">{payment.tenant.fullName}</h4>
                                <Link href={`/${userId}/flats/${payment.flatId}`} className="text-sm text-blue-600 hover:underline">
                                    {payment.flat.building.name} - {payment.flat.flatNumber}
                                </Link>
                                {payment.flat.floor?.number !== undefined && (
                                    <span className="text-xs text-muted-foreground block">
                                        Floor {payment.flat.floor.number}
                                    </span>
                                )}
                            </div>
                            <Badge variant="destructive">{payment.status}</Badge>
                        </div>
                        
                        <div className="flex justify-between items-end border-t pt-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Month</p>
                                <p className="text-sm font-medium">
                                    {new Date(payment.month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Pending Amount</p>
                                <p className="text-lg font-bold text-red-600">
                                    ₹{payment.balance.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-2 w-full">
                            <LogPaymentDialog payment={payment} />
                        </div>
                    </div>
                ))}
            </div>

            {/* View All Button */}
            {hasMore && (
                <div className="text-center pt-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAll(!showAll)}
                        className="w-full md:w-auto"
                    >
                        {showAll ? 'Show Less' : `View All (${payments.length} Pending)`}
                    </Button>
                </div>
            )}
        </div>
    )
}
