import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, max } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(categories.sortOrder);

  return NextResponse.json({ categories: allCategories });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, name.trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    // Get max sort order
    const [maxOrder] = await db
      .select({ max: max(categories.sortOrder) })
      .from(categories);

    const newSortOrder = (maxOrder?.max ?? -1) + 1;

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: name.trim(),
        sortOrder: newSortOrder,
      })
      .returning();

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
