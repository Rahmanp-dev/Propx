"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, RefreshCw } from "lucide-react"
import { sendBroadcastMessage } from "@/lib/actions/whatsapp"
import { getBuildings } from "@/lib/actions/building"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function BroadcastDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [buildingId, setBuildingId] = useState<string>("")
    const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            getBuildings()
                .then(res => {
                    if (res.data) {
                        setBuildings(res.data.map((b: any) => ({ id: b.id, name: b.name })))
                    }
                })
                .catch(err => {
                    console.error("Failed to load buildings:", err)
                })
        }
    }, [open])

    async function handleSend() {
        if (!message.trim()) {
            toast.error("Please enter a message")
            return
        }
        setLoading(true)
        try {
            const result = await sendBroadcastMessage(
                message.trim(),
                buildingId && buildingId !== "all" ? buildingId : undefined
            )
            if (result.success) {
                toast.success(`Broadcast sent to ${result.data?.count ?? 0} tenants`)
                setMessage("")
                setBuildingId("")
                setOpen(false)
                router.refresh()
            } else {
                toast.error((result as any).error || "Failed to send broadcast")
            }
        } catch {
            toast.error("An error occurred while sending broadcast")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Broadcast Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Broadcast Message</DialogTitle>
                    <DialogDescription>
                        Send a WhatsApp message to all tenants or a specific building.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="building">Building (Optional)</Label>
                        <Select value={buildingId} onValueChange={setBuildingId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Buildings" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Buildings</SelectItem>
                                {buildings.map(b => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Type your broadcast message here..."
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {message.length}/1000
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                        {loading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Megaphone className="mr-2 h-4 w-4" />
                        )}
                        Send Broadcast
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
