"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ImageIcon } from "lucide-react"

export function ScreenshotViewer({
    url,
    orgName,
}: {
    url: string
    orgName: string
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Payment Screenshot — {orgName}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={url}
                        alt={`Payment screenshot for ${orgName}`}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
