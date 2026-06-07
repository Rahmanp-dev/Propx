"use server";

import prisma from "@/lib/prisma";
import clientPromise from "@/lib/mongo";
import { z } from "zod";
import { ObjectId } from "mongodb";

// ==========================================
// PUBLIC DISCOVER QUERIES (No Auth Required)
// ==========================================

export async function getDiscoverBuildings(filters?: {
  city?: string;
  flatType?: string;
  minBudget?: number;
  maxBudget?: number;
  vacantOnly?: boolean;
}) {
  try {
    const buildings = await prisma.building.findMany({
      where: {
        discoverEnabled: true,
        organization: { isActive: true, isSuspended: false },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        flats: {
          select: {
            id: true,
            flatType: true,
            rentAmount: true,
            maintenanceAmount: true,
            depositAmount: true,
            status: true,
          },
        },
        clauses: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
          },
        },
      },
    });

    // Transform into public-safe data (no org details, no owner PII)
    const result = buildings
      .filter((b) => typeof b.latitude === 'number' && isFinite(b.latitude) && b.latitude !== 0 &&
                      typeof b.longitude === 'number' && isFinite(b.longitude) && b.longitude !== 0)
      .map((b) => {
      const vacantFlats = b.flats.filter((f) => f.status === "VACANT");
      const allRents = b.flats.map((f) => f.rentAmount).filter((r) => r > 0);
      const flatTypes = [...new Set(b.flats.map((f) => f.flatType))];

      return {
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        latitude: b.latitude,
        longitude: b.longitude,
        discoverBio: b.discoverBio,
        amenities: b.amenities,
        photos: b.photos,
        ratePerUnit: b.ratePerUnit,
        totalFlats: b.flats.length,
        vacantCount: vacantFlats.length,
        flatTypes,
        rentRange:
          allRents.length > 0
            ? { min: Math.min(...allRents), max: Math.max(...allRents) }
            : null,
        clauseCount: b.clauses.length,
        hasCriticalClauses: b.clauses.some((c) => c.severity === "CRITICAL"),
      };
    });

    // Apply client-side filters
    let filtered = result;

    if (filters?.vacantOnly) {
      filtered = filtered.filter((b) => b.vacantCount > 0);
    }

    if (filters?.flatType) {
      filtered = filtered.filter((b) =>
        b.flatTypes.includes(filters.flatType as never),
      );
    }

    if (filters?.minBudget && filters.minBudget > 0) {
      filtered = filtered.filter(
        (b) => b.rentRange && b.rentRange.max >= filters.minBudget!,
      );
    }

    if (filters?.maxBudget && filters.maxBudget > 0) {
      filtered = filtered.filter(
        (b) => b.rentRange && b.rentRange.min <= filters.maxBudget!,
      );
    }

    return { success: true, data: filtered };
  } catch (error: unknown) {
    console.error("Failed to fetch discover buildings:", error);
    return {
      error: `Failed to load buildings: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getDiscoverBuildingDetail(buildingId: string) {
  try {
    if (!ObjectId.isValid(buildingId)) {
      return { error: "Invalid building ID" };
    }

    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        discoverEnabled: true,
        organization: { isActive: true, isSuspended: false },
      },
      include: {
        flats: {
          select: {
            id: true,
            flatNumber: true,
            flatType: true,
            rentAmount: true,
            maintenanceAmount: true,
            depositAmount: true,
            electricityType: true,
            status: true,
          },
        },
        clauses: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            category: true,
            title: true,
            description: true,
            severity: true,
          },
        },
      },
    });

    if (!building) {
      return { error: "Building not found or not available on Discover" };
    }

    const vacantFlats = building.flats.filter((f) => f.status === "VACANT");
    const allRents = building.flats
      .map((f) => f.rentAmount)
      .filter((r) => r > 0);
    const flatTypes = [...new Set(building.flats.map((f) => f.flatType))];

    // Group vacant flats by type for display
    const vacantByType: Record<
      string,
      { count: number; rentRange: { min: number; max: number } }
    > = {};
    for (const flat of vacantFlats) {
      const type = flat.flatType;
      if (!vacantByType[type]) {
        vacantByType[type] = { count: 0, rentRange: { min: Infinity, max: 0 } };
      }
      vacantByType[type].count++;
      vacantByType[type].rentRange.min = Math.min(
        vacantByType[type].rentRange.min,
        flat.rentAmount,
      );
      vacantByType[type].rentRange.max = Math.max(
        vacantByType[type].rentRange.max,
        flat.rentAmount,
      );
    }

    // Return public-safe data only
    return {
      success: true,
      data: {
        id: building.id,
        name: building.name,
        address: building.address,
        city: building.city,
        latitude: building.latitude,
        longitude: building.longitude,
        discoverBio: building.discoverBio,
        amenities: building.amenities,
        photos: building.photos,
        ratePerUnit: building.ratePerUnit,
        totalFlats: building.flats.length,
        vacantCount: vacantFlats.length,
        flatTypes,
        rentRange:
          allRents.length > 0
            ? { min: Math.min(...allRents), max: Math.max(...allRents) }
            : null,
        vacantByType,
        clauses: building.clauses,
        contactWhatsApp: building.contactWhatsApp,
      },
    };
  } catch (error: unknown) {
    console.error("Failed to fetch building detail:", error);
    return {
      error: `Failed to load building: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ==========================================
// PUBLIC INQUIRY SUBMISSION (No Auth)
// ==========================================

const discoverInquirySchema = z.object({
  buildingId: z.string().min(1, "Building ID is required"),
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(10, "Valid phone number required").max(15),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  preferredBHK: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  message: z.string().max(500).optional(),
  source: z.enum(["DISCOVER", "QR_SCAN"]).default("DISCOVER"),
  utmSource: z.string().optional(),
  clausesAccepted: z.boolean().default(false),
});

type DiscoverInquiryInput = z.infer<typeof discoverInquirySchema>;

export async function submitDiscoverInquiry(data: DiscoverInquiryInput) {
  const result = discoverInquirySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues.map((e) => e.message).join(", ") };
  }

  const {
    buildingId,
    name,
    phone,
    email,
    preferredBHK,
    budget,
    message,
    source,
    utmSource,
    clausesAccepted,
  } = result.data;

  try {
    // Verify building exists and is discoverable
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        discoverEnabled: true,
        organization: { isActive: true, isSuspended: false },
      },
      select: { id: true, organizationId: true },
    });

    if (!building) {
      return { error: "Building not found" };
    }

    const client = await clientPromise;
    const db = client.db("propx");

    const now = new Date();
    const doc = {
      buildingId: new ObjectId(buildingId),
      name,
      phone,
      email: email || null,
      flatType: preferredBHK || null,
      preferredBHK: preferredBHK || null,
      budget: budget || null,
      message: message || null,
      source,
      status: "NEW",
      notes: null,
      utmSource: utmSource || null,
      utmBuildingId: buildingId,
      clausesAccepted,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection("TenantInquiry").insertOne(doc);

    // Create notification for the building's organization
    if (building.organizationId) {
      await db.collection("Notification").insertOne({
        organizationId: new ObjectId(building.organizationId),
        type: "INQUIRY_NEW",
        title: "New Discover Inquiry",
        message: `New inquiry from ${name} via PropX Discover`,
        isRead: false,
        data: JSON.stringify({
          inquiryId: insertResult.insertedId.toString(),
          phone,
          source,
          buildingId,
        }),
        createdAt: now,
      });
    }

    return { success: true, data: { id: insertResult.insertedId.toString() } };
  } catch (error: unknown) {
    console.error("Failed to submit discover inquiry:", error);
    return {
      error: `Failed to submit inquiry: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ==========================================
// QR SCAN LOGGING (No Auth)
// ==========================================

export async function logQRScan(
  buildingId: string,
  userAgent?: string,
  referrer?: string,
) {
  try {
    if (!ObjectId.isValid(buildingId)) return;

    const client = await clientPromise;
    const db = client.db("propx");

    await db.collection("QRScanLog").insertOne({
      buildingId: new ObjectId(buildingId),
      scannedAt: new Date(),
      userAgent: userAgent || null,
      referrer: referrer || null,
    });
  } catch (error) {
    // Silently fail — analytics should never block UX
    console.error("Failed to log QR scan:", error);
  }
}
