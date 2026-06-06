import { z } from "zod"

export const createBuildingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().default("Hyderabad"),
    totalFloors: z.coerce.number().min(1, "Must have at least 1 floor"),
    defaultRentBHK1: z.coerce.number().min(0).optional(),
    defaultRentBHK2: z.coerce.number().min(0).optional(),
    defaultRentBHK3: z.coerce.number().min(0).optional(),
    ratePerUnit: z.coerce.number().min(0).optional(),
    rentDueDay: z.coerce.number().min(1).max(28).optional(),
    lateFeePercent: z.coerce.number().min(0).max(100).optional(),
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
})

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>

export const onboardTenantSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Invalid phone number"),
    email: z.string().email().optional().or(z.literal("")),
    aadhaarNumber: z.string().optional(),
    occupantsCount: z.coerce.number().min(1),
    leaseStartDate: z.date(),
    leaseEndDate: z.date().optional(),
    flatId: z.string().min(1, "Flat ID is required"),
    paymentMethodId: z.string().optional().or(z.literal("")),
    rentAmount: z.coerce.number().min(0),
    depositAmount: z.coerce.number().min(0),
    initialMeterReading: z.coerce.number().min(0).optional(),
    whatsappOptIn: z.boolean().default(true),
})

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>

export const maintenanceRequestSchema = z.object({
    flatId: z.string().min(1),
    buildingId: z.string().min(1),
    tenantId: z.string().optional(),
    category: z.enum(["PLUMBING", "ELECTRICAL", "CARPENTRY", "PAINTING", "CLEANING", "PEST_CONTROL", "OTHER"]),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
})

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>

export const tenantInquirySchema = z.object({
    buildingId: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone is required"),
    email: z.string().email().optional().or(z.literal("")),
    flatType: z.string().optional(),
    budget: z.coerce.number().min(0).optional(),
    message: z.string().optional(),
    source: z.enum(["WHATSAPP", "WEBSITE", "WALK_IN", "REFERRAL", "PHONE"]).default("WHATSAPP"),
})

export type TenantInquiryInput = z.infer<typeof tenantInquirySchema>

export const broadcastMessageSchema = z.object({
    message: z.string().min(1, "Message is required").max(1024),
    buildingId: z.string().optional(),
})

export type BroadcastMessageInput = z.infer<typeof broadcastMessageSchema>
