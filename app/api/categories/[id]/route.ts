import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, menus } from "@/lib/db/schema";
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
    const { name, sortOrder } = body;

    // Check if category exists
    const [existingCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      // Check for duplicate name
      const duplicate = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, name.trim()))
        .limit(1);

      if (duplicate.length > 0 && duplicate[0].id !== id) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (sortOrder !== undefined) {
      updates.sortOrder = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    // Check if category exists
    const [existingCategory] = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if any menus use this category
    const menusUsingCategory = await db
      .select({ id: menus.id })
      .from(menus)
      .where(eq(menus.categoryId, id))
      .limit(1);

    if (menusUsingCategory.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is in use by menus" },
        { status: 400 }
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
