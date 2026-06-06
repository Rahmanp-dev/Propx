"use client"

export function DiscoverClient({ buildings }: { buildings: any[] }) {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Discover Client</h1>
            <p className="text-gray-400">Map and listing interface goes here.</p>
            <p className="text-sm text-gray-500 mt-2">Found {buildings.length} buildings.</p>
        </div>
    )
}
