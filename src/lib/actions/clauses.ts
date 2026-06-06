"use server";

import clientPromise from "@/lib/mongo";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import {
  CLAUSE_CATEGORIES,
  CLAUSE_SEVERITIES,
  CLAUSE_TEMPLATES,
} from "@/lib/clause-templates";

// ==========================================
// ORG CONTEXT HELPER
// ==========================================

async function getOrgContext() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as {
    id: string;
    role: string;
    organizationId?: string | null;
  };
  return {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId || null,
    isSuperAdmin: user.role === "SUPER_ADMIN",
  };
}

// ==========================================
// SCHEMAS
// ==========================================

const createClauseSchema = z.object({
  buildingId: z.string().min(1),
  category: z.enum(CLAUSE_CATEGORIES).default("CUSTOM"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  severity: z.enum(CLAUSE_SEVERITIES).default("MEDIUM"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().min(0).default(0),
});

type CreateClauseInput = z.infer<typeof createClauseSchema>;

const updateClauseSchema = z.object({
  clauseId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  category: z.enum(CLAUSE_CATEGORIES).optional(),
  severity: z.enum(CLAUSE_SEVERITIES).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().min(0).optional(),
});

type UpdateClauseInput = z.infer<typeof updateClauseSchema>;

// ==========================================
// QUERIES
// ==========================================

export async function getBuildingClauses(buildingId: string) {
  try {
    const orgCtx = await getOrgContext();
    if (!orgCtx) return { error: "Not authenticated" };

    // Verify building belongs to org
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        ...(orgCtx.isSuperAdmin
          ? {}
          : { organizationId: orgCtx.organizationId! }),
      },
    });
    if (!building) return { error: "Building not found" };

    const clauses = await prisma.buildingClause.findMany({
      where: { buildingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { success: true, data: clauses };
  } catch (error: unknown) {
    console.error("Failed to fetch building clauses:", error);
    return {
      error: `Failed to fetch building clauses: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Public query — no auth required, only returns active clauses
export async function getPublicBuildingClauses(buildingId: string) {
  try {
    const clauses = await prisma.buildingClause.findMany({
      where: { buildingId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        severity: true,
        sortOrder: true,
      },
    });
    return { success: true, data: clauses };
  } catch (error: unknown) {
    console.error("Failed to fetch public clauses:", error);
    return {
      error: `Failed to fetch clauses: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ==========================================
// MUTATIONS
// ==========================================

export async function createClause(data: CreateClauseInput) {
  const orgCtx = await getOrgContext();
  if (!orgCtx) return { error: "Not authenticated" };

  const result = createClauseSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues.map((e) => e.message).join(", ") };
  }

  const {
    buildingId,
    category,
    title,
    description,
    severity,
    isActive,
    sortOrder,
  } = result.data;

  try {
    // Verify building belongs to org
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        ...(orgCtx.isSuperAdmin
          ? {}
          : { organizationId: orgCtx.organizationId! }),
      },
    });
    if (!building) return { error: "Building not found" };

    const client = await clientPromise;
    const db = client.db("propx");

    const now = new Date();
    const doc = {
      buildingId: new ObjectId(buildingId),
      category,
      title,
      description,
      severity,
      isActive,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection("BuildingClause").insertOne(doc);

    revalidatePath("/", "layout");
    return { success: true, data: { id: insertResult.insertedId.toString() } };
  } catch (error: unknown) {
    console.error("Failed to create clause:", error);
    return {
      error: `Failed to create clause: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function updateClause(data: UpdateClauseInput) {
  const orgCtx = await getOrgContext();
  if (!orgCtx) return { error: "Not authenticated" };

  const result = updateClauseSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues.map((e) => e.message).join(", ") };
  }

  const { clauseId, ...updates } = result.data;

  try {
    // Verify clause's building belongs to org
    const clause = await prisma.buildingClause.findUnique({
      where: { id: clauseId },
      include: { building: { select: { organizationId: true } } },
    });
    if (!clause) return { error: "Clause not found" };
    if (
      !orgCtx.isSuperAdmin &&
      clause.building.organizationId !== orgCtx.organizationId
    ) {
      return { error: "Clause not found" };
    }

    const client = await clientPromise;
    const db = client.db("propx");

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.title !== undefined) updateFields.title = updates.title;
    if (updates.description !== undefined)
      updateFields.description = updates.description;
    if (updates.category !== undefined)
      updateFields.category = updates.category;
    if (updates.severity !== undefined)
      updateFields.severity = updates.severity;
    if (updates.isActive !== undefined)
      updateFields.isActive = updates.isActive;
    if (updates.sortOrder !== undefined)
      updateFields.sortOrder = updates.sortOrder;

    await db
      .collection("BuildingClause")
      .updateOne({ _id: new ObjectId(clauseId) }, { $set: updateFields });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update clause:", error);
    return {
      error: `Failed to update clause: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function deleteClause(clauseId: string) {
  const orgCtx = await getOrgContext();
  if (!orgCtx) return { error: "Not authenticated" };

  try {
    const clause = await prisma.buildingClause.findUnique({
      where: { id: clauseId },
      include: { building: { select: { organizationId: true } } },
    });
    if (!clause) return { error: "Clause not found" };
    if (
      !orgCtx.isSuperAdmin &&
      clause.building.organizationId !== orgCtx.organizationId
    ) {
      return { error: "Clause not found" };
    }

    const client = await clientPromise;
    const db = client.db("propx");

    // Delete acknowledgments first
    await db
      .collection("ClauseAcknowledgment")
      .deleteMany({ clauseId: new ObjectId(clauseId) });
    // Delete clause
    await db
      .collection("BuildingClause")
      .deleteOne({ _id: new ObjectId(clauseId) });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete clause:", error);
    return {
      error: `Failed to delete clause: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function addTemplateClausesToBuilding(buildingId: string) {
  const orgCtx = await getOrgContext();
  if (!orgCtx) return { error: "Not authenticated" };

  try {
    const building = await prisma.building.findFirst({
      where: {
        id: buildingId,
        ...(orgCtx.isSuperAdmin
          ? {}
          : { organizationId: orgCtx.organizationId! }),
      },
    });
    if (!building) return { error: "Building not found" };

    // Check if building already has clauses
    const existingCount = await prisma.buildingClause.count({
      where: { buildingId },
    });
    if (existingCount > 0) {
      return {
        error:
          "Building already has clauses. Delete existing clauses first or add templates individually.",
      };
    }

    const client = await clientPromise;
    const db = client.db("propx");

    const now = new Date();
    const docs = CLAUSE_TEMPLATES.map((t, i) => ({
      buildingId: new ObjectId(buildingId),
      category: t.category,
      title: t.title,
      description: t.description,
      severity: t.severity,
      isActive: true,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    }));

    await db.collection("BuildingClause").insertMany(docs);

    revalidatePath("/", "layout");
    return { success: true, data: { count: docs.length } };
  } catch (error: unknown) {
    console.error("Failed to add template clauses:", error);
    return {
      error: `Failed to add template clauses: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
