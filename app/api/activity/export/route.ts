import { NextResponse } from "next/server";
import { db, activityLogs, users, versions, menus } from "@/lib/db";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const actionLabels: Record<string, string> = {
  version_created: "Created version",
  status_changed: "Changed status",
  comment_added: "Added comment",
  pdf_downloaded: "Downloaded PDF",
  pdf_viewed: "Viewed PDF",
  version_assigned: "Assigned version",
  user_logged_in: "Logged in",
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get("action");

  const validActions = [
    "version_created",
    "status_changed",
    "comment_added",
    "pdf_downloaded",
    "pdf_viewed",
    "version_assigned",
    "user_logged_in",
  ] as const;

  type ActionType = (typeof validActions)[number];

  try {
    // Build query
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

    const isValidAction =
      actionFilter && validActions.includes(actionFilter as ActionType);

    const logs = isValidAction
      ? await baseQuery
          .where(eq(activityLogs.action, actionFilter as ActionType))
          .orderBy(desc(activityLogs.createdAt))
          .limit(1000)
      : await baseQuery.orderBy(desc(activityLogs.createdAt)).limit(1000);

    // Batch fetch version and menu names
    const versionIds = logs
      .filter((l) => l.targetType === "version")
      .map((l) => l.targetId);

    const versionMap = new Map<
      string,
      { label: string; menuId: string; menuName: string }
    >();

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

    // Build CSV
    const headers = ["Date", "User", "Action", "Target", "Details"];
    const rows = logs.map((log) => {
      const versionInfo =
        log.targetType === "version" ? versionMap.get(log.targetId) : null;
      const metadata = log.metadata as Record<string, unknown> | null;

      let target = "";
      if (versionInfo) {
        target = `${versionInfo.menuName} - ${versionInfo.label}`;
      } else if (log.targetType) {
        target = log.targetType;
      }

      let details = "";
      if (log.action === "status_changed" && metadata) {
        details = `${metadata.previousStatus} → ${metadata.newStatus}`;
      } else if (log.action === "comment_added" && metadata) {
        details = `Category: ${metadata.category}`;
      } else if (log.action === "version_assigned" && metadata) {
        details = metadata.newAssignee ? "Assigned" : "Unassigned";
      }

      return [
        escapeCSV(new Date(log.createdAt).toISOString()),
        escapeCSV(log.userName || "Unknown"),
        escapeCSV(actionLabels[log.action] || log.action),
        escapeCSV(target),
        escapeCSV(details),
      ];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    // Generate filename with date range
    const dates = logs.map((l) => new Date(l.createdAt));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();

    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const filename =
      minDate.getTime() === maxDate.getTime() || dates.length === 0
        ? `activity_log_${formatDate(new Date())}.csv`
        : `activity_log_${formatDate(minDate)}_to_${formatDate(maxDate)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export activity log error:", error);
    return NextResponse.json(
      { error: "Failed to export activity log" },
      { status: 500 }
    );
  }
}
