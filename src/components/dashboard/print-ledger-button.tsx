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
    selectedBuildingName?: string
}

export function PrintLedgerButton({ masterData, currentMonth, totalExpected, totalCollected, totalPending, selectedBuildingName }: PrintLedgerProps) {
    const handleDownload = () => {
        if (!masterData || masterData.length === 0) return

        const doc = new jsPDF({ orientation: 'landscape' })
        
        let displayMonth = new Date()
        const parsedDate = new Date(`${currentMonth}-01T00:00:00`)
        if (!isNaN(parsedDate.getTime())) {
            displayMonth = parsedDate
        }
        const monthName = format(displayMonth, 'MMMM yyyy')

        // Title
        doc.setFontSize(20)
        doc.text("PropX - Master Monthly Ledger", 14, 22)
        doc.setFontSize(12)
        let subtitle = `Report for: ${monthName}`
        if (selectedBuildingName) {
            subtitle += ` | Building: ${selectedBuildingName}`
        }
        doc.text(subtitle, 14, 32)
        
        // Summary
        doc.setFontSize(10)
        doc.text(`Total Expected: Rs. ${totalExpected.toLocaleString('en-IN')}`, 14, 42)
        doc.text(`Total Collected: Rs. ${totalCollected.toLocaleString('en-IN')}`, 100, 42)
        doc.text(`Total Pending: Rs. ${totalPending.toLocaleString('en-IN')}`, 180, 42)

        // Table
        const tableData = masterData.map(p => {
            const flatDisplay = selectedBuildingName 
                ? `Flat ${p.flat.flatNumber}`
                : `${p.flat.building.name} - Flat ${p.flat.flatNumber}`
                
            const elecReading = p.flat.meterReadings && p.flat.meterReadings.length > 0 
                ? p.flat.meterReadings[0].reading 
                : '-'
                
            return [
                flatDisplay,
                p.tenant.fullName,
                `Rs. ${p.rentDue?.toLocaleString('en-IN') || 0}`,
                `Rs. ${p.maintenanceDue?.toLocaleString('en-IN') || 0}`,
                `Rs. ${p.electricityDue?.toLocaleString('en-IN') || 0}`,
                elecReading,
                `Rs. ${p.arrears?.toLocaleString('en-IN') || 0}`,
                p.amountPaid > 0 ? `Rs. ${p.amountPaid.toLocaleString('en-IN')}` : '-',
                p.balance > 0 ? `Rs. ${p.balance.toLocaleString('en-IN')}` : '-',
                p.status
            ]
        })

        autoTable(doc, {
            startY: 50,
            head: [['Flat', 'Tenant', 'Rent', 'Maint.', 'Elec. Amt', 'Elec. Reading', 'Arrears', 'Collected', 'Balance', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246] }, // Violet color
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 40 },
                // Allow other columns to auto-size
            }
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
