import { NextResponse } from "next/server";
import { db, activityLogs, users, versions, menus } from "@/lib/db";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get("action");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Valid actions for filtering
  const validActions = [
    "version_created",
    "status_changed",
    "comment_added",
    "pdf_downloaded",
    "pdf_viewed",
    "version_assigned",
    "user_logged_in",
  ] as const;

  type ActionType = typeof validActions[number];

  // Build query with conditional where clause
  const baseQuery = db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      action: activityLogs.action,
      targetType: activityLogs.targetType,
      targetId: activityLogs.targetId,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id));

  // Apply filter if valid
  const isValidAction = actionFilter && validActions.includes(actionFilter as ActionType);

  const logs = isValidAction
    ? await baseQuery
        .where(eq(activityLogs.action, actionFilter as ActionType))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
    : await baseQuery
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);

  // Batch fetch version and menu names for context
  const versionIds = logs
    .filter((l) => l.targetType === "version")
    .map((l) => l.targetId);

  const versionMap = new Map<string, { label: string; menuId: string; menuName: string }>();

  if (versionIds.length > 0) {
    const versionDetails = await db
      .select({
        id: versions.id,
        versionLabel: versions.versionLabel,
        menuId: versions.menuId,
        menuName: menus.name,
      })
      .from(versions)
      .leftJoin(menus, eq(versions.menuId, menus.id))
      .where(inArray(versions.id, versionIds));

    versionDetails.forEach((v) => {
      versionMap.set(v.id, {
        label: v.versionLabel,
        menuId: v.menuId,
        menuName: v.menuName || "Unknown Menu",
      });
    });
  }

  // Enrich logs with context
  const enrichedLogs = logs.map((log) => {
    const versionInfo = log.targetType === "version" ? versionMap.get(log.targetId) : null;

    return {
      id: log.id,
      userId: log.userId,
      userName: log.userName || "Unknown",
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt,
      versionLabel: versionInfo?.label || null,
      menuId: versionInfo?.menuId || null,
      menuName: versionInfo?.menuName || null,
    };
  });

  return NextResponse.json({ activities: enrichedLogs });
}
