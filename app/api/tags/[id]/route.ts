import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, menuTags } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, colour } = body;

    // Check if tag exists
    const [existingTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      // Check for duplicate name
      const duplicate = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, name.trim()))
        .limit(1);

      if (duplicate.length > 0 && duplicate[0].id !== id) {
        return NextResponse.json(
          { error: "A tag with this name already exists" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (colour !== undefined) {
      updates.colour = colour;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const [updated] = await db
      .update(tags)
      .set(updates)
      .where(eq(tags.id, id))
      .returning();

    return NextResponse.json({ tag: updated });
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Check if tag exists
    const [existingTag] = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if any menus use this tag
    const menusUsingTag = await db
      .select({ tagId: menuTags.tagId })
      .from(menuTags)
      .where(eq(menuTags.tagId, id))
      .limit(1);

    if (menusUsingTag.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete tag that is in use by menus" },
        { status: 400 }
      );
    }

    await db.delete(tags).where(eq(tags.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
