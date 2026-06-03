"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

interface PrintLedgerProps {
    masterData: any[]
    currentMonth: string
    totalExpected: number
    totalCollected: number
    totalPending: number
}

export function PrintLedgerButton({ masterData, currentMonth, totalExpected, totalCollected, totalPending }: PrintLedgerProps) {
    const handleDownload = () => {
        if (!masterData || masterData.length === 0) return

        const doc = new jsPDF()
        const monthName = format(new Date(`${currentMonth}-01`), 'MMMM yyyy')

        // Title
        doc.setFontSize(20)
        doc.text("PropX - Master Monthly Ledger", 14, 22)
        doc.setFontSize(12)
        doc.text(`Report for: ${monthName}`, 14, 32)
        
        // Summary
        doc.setFontSize(10)
        doc.text(`Total Expected: Rs. ${totalExpected.toLocaleString()}`, 14, 42)
        doc.text(`Total Collected: Rs. ${totalCollected.toLocaleString()}`, 80, 42)
        doc.text(`Total Pending: Rs. ${totalPending.toLocaleString()}`, 150, 42)

        // Table
        const tableData = masterData.map(p => [
            p.flat.building.name,
            `Flat ${p.flat.flatNumber}`,
            p.tenant.fullName,
            `Rs. ${p.totalDue.toLocaleString()}`,
            p.amountPaid > 0 ? `Rs. ${p.amountPaid.toLocaleString()}` : '-',
            p.balance > 0 ? `Rs. ${p.balance.toLocaleString()}` : '-',
            p.status
        ])

        autoTable(doc, {
            startY: 50,
            head: [['Building', 'Flat', 'Tenant', 'Expected', 'Collected', 'Balance', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246] }, // Violet color
            styles: { fontSize: 9 },
        })

        doc.save(`PropX_Ledger_${currentMonth}.pdf`)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} className="print-hide">
            <Printer className="w-4 h-4 mr-2" />
            Download PDF
        </Button>
    )
}
