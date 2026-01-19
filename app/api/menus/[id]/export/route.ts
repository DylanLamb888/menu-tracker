import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menus, versions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, desc, inArray } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape quotes and wrap in quotes if needed
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get menu
    const [menu] = await db
      .select({ id: menus.id, name: menus.name })
      .from(menus)
      .where(eq(menus.id, id))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Get all versions
    const versionRows = await db
      .select({
        versionLabel: versions.versionLabel,
        status: versions.status,
        createdAt: versions.createdAt,
        uploadedBy: versions.uploadedBy,
        reasonForChange: versions.reasonForChange,
        changeSummary: versions.changeSummary,
      })
      .from(versions)
      .where(eq(versions.menuId, id))
      .orderBy(desc(versions.createdAt));

    // Get user names
    const userIds = [...new Set(versionRows.map((v) => v.uploadedBy))];
    const userMap = new Map<string, string>();

    if (userIds.length > 0) {
      const usersList = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds));

      usersList.forEach((u) => userMap.set(u.id, u.name));
    }

    // Build CSV
    const headers = ["Version Label", "Status", "Date", "Uploader", "Reason for Change", "Summary"];
    const rows = versionRows.map((v) => [
      escapeCSV(v.versionLabel),
      escapeCSV(v.status),
      escapeCSV(new Date(v.createdAt).toISOString()),
      escapeCSV(userMap.get(v.uploadedBy) || "Unknown"),
      escapeCSV(v.reasonForChange),
      escapeCSV(v.changeSummary),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Generate filename
    const date = new Date().toISOString().split("T")[0];
    const safeName = menu.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${safeName}_history_${date}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export menu history error:", error);
    return NextResponse.json(
      { error: "Failed to export menu history" },
      { status: 500 }
    );
  }
}
