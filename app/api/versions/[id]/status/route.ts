import { NextResponse } from "next/server";
import { db, versions, activityLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { canChangeStatus } from "@/lib/permissions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;

  try {
    const { status: targetStatus } = await request.json();

    if (!targetStatus) {
      return NextResponse.json(
        { error: "Target status is required" },
        { status: 400 }
      );
    }

    // Get current version
    const [version] = await db
      .select()
      .from(versions)
      .where(eq(versions.id, versionId))
      .limit(1);

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Check if user has permission for this transition
    if (!canChangeStatus(user.role, version.status, targetStatus)) {
      return NextResponse.json(
        { error: "You do not have permission to make this status change" },
        { status: 403 }
      );
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      updatedAt: now,
    };

    // Set additional fields based on target status
    if (targetStatus === "approved") {
      updateData.approvedBy = user.id;
      updateData.approvedAt = now;
    } else if (targetStatus === "live") {
      updateData.wentLiveAt = now;

      // Archive any other live versions for this menu
      await db
        .update(versions)
        .set({
          status: "archived",
          archivedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(versions.menuId, version.menuId),
            eq(versions.status, "live")
          )
        );
    } else if (targetStatus === "archived") {
      updateData.archivedAt = now;
    }

    // Update version status
    const [updatedVersion] = await db
      .update(versions)
      .set(updateData)
      .where(eq(versions.id, versionId))
      .returning();

    // Log the activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: "status_changed",
      targetType: "version",
      targetId: versionId,
      metadata: {
        fromStatus: version.status,
        toStatus: targetStatus,
        menuId: version.menuId,
        versionLabel: version.versionLabel,
        timestamp: now.toISOString(),
      },
    });

    return NextResponse.json({ version: updatedVersion });
  } catch (error) {
    console.error("Status change error:", error);
    return NextResponse.json(
      { error: "Failed to change status" },
      { status: 500 }
    );
  }
}
