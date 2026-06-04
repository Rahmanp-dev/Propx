'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"

export function PrintReceiptsButton() {
    const [loading, setLoading] = useState(false)

    const downloadPDF = async () => {
        setLoading(true)
        try {
            const container = document.getElementById('receipts-container')
            if (!container) throw new Error("Receipts container not found")

            // Dynamically import to avoid Next.js SSR issues
            const htmlToImage = await import('html-to-image')
            const { jsPDF } = await import('jspdf')
            
            // Temporarily adjust styles for perfect PDF capture
            const originalWidth = container.style.width
            const originalMaxWidth = container.style.maxWidth
            const originalTransform = container.style.transform
            const originalClassName = container.className
            
            // Force A4 width and 3-column grid for the container so it scales correctly, even on mobile
            container.className = "grid grid-cols-3 gap-[4mm] w-[210mm] bg-white p-4"
            container.style.width = '210mm'
            container.style.maxWidth = '210mm'
            container.style.transform = 'none'

            // Hide all whatsapp buttons
            const pdfHideElements = container.querySelectorAll('.pdf-hide')
            const originalDisplaysHide: string[] = []
            pdfHideElements.forEach((el: any) => {
                originalDisplaysHide.push(el.style.display)
                el.style.display = 'none'
            })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })
            
            const pdfWidth = pdf.internal.pageSize.getWidth()
            
            const slips = Array.from(container.children) as HTMLElement[]
            const originalSlipsDisplays = slips.map(s => s.style.display)
            
            // Hide all slips initially
            slips.forEach(s => s.style.display = 'none')

            const batches = []
            for (let i = 0; i < slips.length; i += 9) {
                batches.push(slips.slice(i, i + 9))
            }

            for (let b = 0; b < batches.length; b++) {
                const batch = batches[b]
                
                // Show only this batch
                batch.forEach(s => {
                    s.style.display = ''
                    s.classList.remove('print:break-after-page')
                })
                
                // Wait a tick for styles to apply
                await new Promise(resolve => setTimeout(resolve, 100))

                const imgData = await htmlToImage.toJpeg(container, {
                    quality: 1.0,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2
                })
                
                const imgProps = pdf.getImageProperties(imgData)
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
                
                if (b > 0) pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight)
                
                // Hide them again
                batch.forEach(s => s.style.display = 'none')
            }
            
            // Restore everything
            slips.forEach((s, idx) => s.style.display = originalSlipsDisplays[idx])
            
            container.className = originalClassName
            container.style.width = originalWidth
            container.style.maxWidth = originalMaxWidth
            container.style.transform = originalTransform
            
            pdfHideElements.forEach((el: any, i) => {
                el.style.display = originalDisplaysHide[i]
            })

            pdf.save('Monthly_Receipts.pdf')
        } catch (error: any) {
            console.error("Failed to generate PDF:", error)
            alert(`Failed to generate PDF: ${error?.message || 'Unknown error occurred'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={downloadPDF} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {loading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
    )
}
