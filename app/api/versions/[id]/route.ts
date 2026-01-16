import { NextResponse } from "next/server";
import { db, versions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;

  const [version] = await db
    .select()
    .from(versions)
    .where(eq(versions.id, versionId))
    .limit(1);

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({ version });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can update version metadata
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: versionId } = await context.params;

  try {
    const body = await request.json();
    const { reasonForChange, changeSummary, assignedTo } = body;

    const [version] = await db
      .select()
      .from(versions)
      .where(eq(versions.id, versionId))
      .limit(1);

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (reasonForChange !== undefined) {
      updateData.reasonForChange = reasonForChange;
    }
    if (changeSummary !== undefined) {
      updateData.changeSummary = changeSummary;
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    const [updatedVersion] = await db
      .update(versions)
      .set(updateData)
      .where(eq(versions.id, versionId))
      .returning();

    return NextResponse.json({ version: updatedVersion });
  } catch (error) {
    console.error("Update version error:", error);
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    );
  }
}
