"use client"

import { useState, useEffect } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyPortalLink() {
    const [copied, setCopied] = useState(false)
    const [portalUrl, setPortalUrl] = useState("")

    useEffect(() => {
        // Only run on client
        setPortalUrl(`${window.location.origin}/tenant-portal/login`)
    }, [])

    const handleCopy = () => {
        if (!portalUrl) return
        navigator.clipboard.writeText(portalUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="hidden sm:flex">
                {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy Portal Link"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleCopy} className="sm:hidden" title="Copy Tenant Portal Link">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            {portalUrl && (
                <Button variant="default" size="sm" asChild>
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Portal
                    </a>
                </Button>
            )}
        </div>
    )
}
