"use client"

import * as React from "react"
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Building, MapPin } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { searchGlobal } from "@/lib/actions/search"

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [data, setData] = React.useState<{ tenants: any[], buildings: any[], flats: any[] } | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const userId = pathname.split('/')[1] || 'user'

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        if (query.length < 2) {
            setData(null)
            return
        }

        const timer = setTimeout(async () => {
            const res = await searchGlobal(query)
            // @ts-ignore
            setData(res.results)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <span className="hidden lg:inline-flex">Search...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." value={query} onValueChange={setQuery} />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    {data?.buildings && data.buildings.length > 0 && (
                        <CommandGroup heading="Buildings">
                            {data.buildings.map(b => (
                                <CommandItem key={b.id} onSelect={() => runCommand(() => router.push(`/${userId}/buildings/${b.id}`))}>
                                    <Building className="mr-2 h-4 w-4" />
                                    <span>{b.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {data?.flats && data.flats.length > 0 && (
                        <CommandGroup heading="Flats">
                            {data.flats.map(f => (
                                <CommandItem key={f.id} onSelect={() => runCommand(() => router.push(`/${userId}/flats/${f.id}`))}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    <span>{f.flatNumber} - {f.building.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {data?.tenants && data.tenants.length > 0 && (
                        <CommandGroup heading="Tenants">
                            {data.tenants.map(t => (
                                <CommandItem key={t.id} onSelect={() => runCommand(() => router.push(`/${userId}/flats/${t.flatId}`))}>
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>{t.title}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">({t.subtitle})</span>
                                        </div>
                                        {t.extra && t.extra !== 'UNKNOWN' && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                t.extra === 'PAID' ? 'bg-green-100 text-green-700' :
                                                t.extra === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                                t.extra === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {t.extra}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandSeparator />

                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => runCommand(() => router.push(`/${userId}/dashboard`))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push(`/${userId}/finance`))}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Finance</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}

function LayoutDashboard({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    )
}
