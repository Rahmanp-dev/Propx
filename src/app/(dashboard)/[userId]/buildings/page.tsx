import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function BuildingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
                <Link href="/dashboard">
                    <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Add Building
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Navigation</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Go to the <Link href="/dashboard" className="text-primary underline">Dashboard</Link> to see all your buildings and add new ones.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
