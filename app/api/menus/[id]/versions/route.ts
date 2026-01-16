import { NextResponse } from "next/server";
import { db, versions, menus, itemChanges } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { uploadPdf } from "@/lib/blob";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: menuId } = await context.params;

  const versionsList = await db
    .select()
    .from(versions)
    .where(eq(versions.menuId, menuId))
    .orderBy(desc(versions.createdAt));

  return NextResponse.json({ versions: versionsList });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: menuId } = await context.params;

  // Verify menu exists
  const [menu] = await db
    .select()
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const reasonForChange = formData.get("reasonForChange") as string | null;
    const changeSummary = formData.get("changeSummary") as string | null;
    const itemChangesJson = formData.get("itemChanges") as string | null;
    const parentVersionIdParam = formData.get("parentVersionId") as string | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Upload PDF to Vercel Blob
    const { url, filename } = await uploadPdf(file, menuId);

    // Generate version label
    const existingVersions = await db
      .select({ versionLabel: versions.versionLabel })
      .from(versions)
      .where(eq(versions.menuId, menuId))
      .orderBy(desc(versions.createdAt));

    let versionNumber = 1;
    if (existingVersions.length > 0) {
      // Extract number from latest version label (e.g., "v1.0" -> 1)
      const match = existingVersions[0].versionLabel.match(/v(\d+)/);
      if (match) {
        versionNumber = parseInt(match[1], 10) + 1;
      }
    }
    const versionLabel = `v${versionNumber}.0`;

    // Determine parent version: use provided ID, or fall back to latest
    let parentVersionId: string | null = null;
    if (parentVersionIdParam) {
      // Verify the parent version exists and belongs to this menu
      const [parentVersion] = await db
        .select({ id: versions.id })
        .from(versions)
        .where(eq(versions.id, parentVersionIdParam))
        .limit(1);

      if (parentVersion) {
        parentVersionId = parentVersion.id;
      }
    } else {
      // Fall back to latest version as parent
      const [latestVersion] = await db
        .select({ id: versions.id })
        .from(versions)
        .where(eq(versions.menuId, menuId))
        .orderBy(desc(versions.createdAt))
        .limit(1);
      parentVersionId = latestVersion?.id || null;
    }

    // Create version record
    const [newVersion] = await db
      .insert(versions)
      .values({
        menuId,
        parentVersionId,
        versionLabel,
        status: "draft",
        pdfUrl: url,
        pdfFilename: filename,
        reasonForChange: reasonForChange || null,
        changeSummary: changeSummary || null,
        uploadedBy: user.id,
      })
      .returning();

    // Insert item changes if provided
    if (itemChangesJson) {
      try {
        const changes = JSON.parse(itemChangesJson) as Array<{
          itemName: string;
          oldValue: string;
          newValue: string;
        }>;

        if (changes.length > 0) {
          await db.insert(itemChanges).values(
            changes.map((change) => ({
              versionId: newVersion.id,
              itemName: change.itemName,
              oldValue: change.oldValue || null,
              newValue: change.newValue || null,
            }))
          );
        }
      } catch {
        // Ignore JSON parse errors for item changes
      }
    }

    // Update menu's updatedAt timestamp
    await db
      .update(menus)
      .set({ updatedAt: new Date() })
      .where(eq(menus.id, menuId));

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Create version error:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
