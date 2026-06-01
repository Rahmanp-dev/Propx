import { SkeletonCard, SkeletonTable } from "@/components/ui/app-skeletons"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            <SkeletonTable />
        </div>
    )
}
