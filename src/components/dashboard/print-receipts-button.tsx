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
            
            // Hide all whatsapp buttons before cloning
            const pdfHideElements = container.querySelectorAll('.pdf-hide')
            const originalDisplays: string[] = []
            pdfHideElements.forEach((el: any) => {
                originalDisplays.push(el.style.display)
                el.style.display = 'none'
            })

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })
            
            const pdfWidth = pdf.internal.pageSize.getWidth()
            
            const slips = Array.from(container.children)
            const batches = []
            for (let i = 0; i < slips.length; i += 9) {
                batches.push(slips.slice(i, i + 9))
            }

            for (let b = 0; b < batches.length; b++) {
                const batch = batches[b]
                
                // create a temporary container exactly matching the original grid
                const tempContainer = document.createElement('div')
                tempContainer.className = "grid grid-cols-3 gap-[4mm] bg-white p-4"
                tempContainer.style.width = '210mm'
                // Ensure the container renders fully even if off-screen
                tempContainer.style.position = 'fixed'
                tempContainer.style.top = '-9999px'
                tempContainer.style.left = '0'
                
                batch.forEach(slip => {
                    const clone = slip.cloneNode(true) as HTMLElement
                    // Remove page break classes for the clone so it renders properly in the image
                    clone.classList.remove('print:break-after-page')
                    tempContainer.appendChild(clone)
                })
                
                document.body.appendChild(tempContainer)
                
                // Wait a tick for styles to apply
                await new Promise(resolve => setTimeout(resolve, 100))

                const imgData = await htmlToImage.toJpeg(tempContainer, {
                    quality: 1.0,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2
                })
                
                document.body.removeChild(tempContainer)
                
                const imgProps = pdf.getImageProperties(imgData)
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
                
                if (b > 0) pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight)
            }
            
            // Restore original styles
            pdfHideElements.forEach((el: any, i) => {
                el.style.display = originalDisplays[i]
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
