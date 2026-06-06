// Pre-built clause templates — shared between server actions and client components
// This file does NOT have 'use server' so it can export plain objects

export const CLAUSE_CATEGORIES = [
    "OCCUPANCY", "ELECTRICITY", "LOCK_IN", "STRUCTURAL", "PETS",
    "NOISE", "GUESTS", "PARKING", "WASTE", "POLICE_VERIFICATION", "CUSTOM"
] as const

export const CLAUSE_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const

export type ClauseCategory = typeof CLAUSE_CATEGORIES[number]
export type ClauseSeverity = typeof CLAUSE_SEVERITIES[number]

export const CLAUSE_TEMPLATES = [
    {
        category: "OCCUPANCY" as const,
        title: "Residential Use Only",
        description: "The premises shall be used exclusively for residential purposes. No commercial, industrial, or subletting activities are permitted without prior written consent from the owner.",
        severity: "CRITICAL" as const,
    },
    {
        category: "ELECTRICITY" as const,
        title: "Electricity Meter Policy",
        description: "Tenant is responsible for all electricity charges based on metered readings. Meter tampering, bypassing, or unauthorized load increases are strictly prohibited and may be punishable under the Electricity Act 2003.",
        severity: "CRITICAL" as const,
    },
    {
        category: "POLICE_VERIFICATION" as const,
        title: "Mandatory Police Verification",
        description: "Tenant must complete police verification within 7 days of move-in. Non-compliance constitutes grounds for termination of the lease agreement.",
        severity: "CRITICAL" as const,
    },
    {
        category: "LOCK_IN" as const,
        title: "Lock-in Period",
        description: "Minimum stay period of 6 months from the date of move-in. Early termination requires 2 months' rent as compensation or as mutually agreed.",
        severity: "HIGH" as const,
    },
    {
        category: "STRUCTURAL" as const,
        title: "No Structural Modifications",
        description: "No drilling, painting, structural alterations, or fixture installations without prior written consent from the owner. Any unauthorized modifications will be restored at the tenant's expense upon vacating.",
        severity: "HIGH" as const,
    },
    {
        category: "PETS" as const,
        title: "No Pets Policy",
        description: "No pets of any kind are allowed on the premises without prior written approval from the owner and an additional security deposit as agreed.",
        severity: "MEDIUM" as const,
    },
    {
        category: "NOISE" as const,
        title: "Quiet Hours & Noise Policy",
        description: "Quiet hours: 10:00 PM – 7:00 AM. No loud music, parties, or activities that disturb other tenants or neighbors during these hours.",
        severity: "MEDIUM" as const,
    },
    {
        category: "GUESTS" as const,
        title: "Guest & Visitor Policy",
        description: "Overnight guests limited to 5 days per month. Long-term guests (more than 7 consecutive days) require prior notification to the owner.",
        severity: "MEDIUM" as const,
    },
    {
        category: "PARKING" as const,
        title: "Vehicle & Parking Rules",
        description: "One designated parking slot per flat. No unauthorized vehicle storage in common areas. Two-wheeler parking as per building rules.",
        severity: "LOW" as const,
    },
    {
        category: "WASTE" as const,
        title: "Waste Disposal & Hygiene",
        description: "Tenant must segregate waste (wet/dry) and follow building waste disposal schedules. No disposal of waste in common areas, corridors, or stairways.",
        severity: "LOW" as const,
    },
] as const

export type ClauseTemplate = typeof CLAUSE_TEMPLATES[number]
