import { NextResponse } from "next/server";
import { db, menus, versions, categories } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all non-archived menus with their latest version status
  const allMenus = await db
    .select({
      id: menus.id,
      name: menus.name,
      categoryId: menus.categoryId,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
    })
    .from(menus)
    .where(eq(menus.isArchived, false))
    .orderBy(desc(menus.updatedAt));

  // Get category names and latest version status for each menu
  const menusWithDetails = await Promise.all(
    allMenus.map(async (menu) => {
      // Get category name
      let categoryName: string | null = null;
      if (menu.categoryId) {
        const [category] = await db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, menu.categoryId))
          .limit(1);
        categoryName = category?.name || null;
      }

      // Get latest version status (prefer live, then most recent)
      const [latestVersion] = await db
        .select({ status: versions.status })
        .from(versions)
        .where(eq(versions.menuId, menu.id))
        .orderBy(desc(versions.createdAt))
        .limit(1);

      return {
        id: menu.id,
        name: menu.name,
        category: categoryName,
        currentStatus: latestVersion?.status || null,
        updatedAt: menu.updatedAt,
      };
    })
  );

  return NextResponse.json({ menus: menusWithDetails });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can create menus
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, categoryId } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Menu name is required" },
        { status: 400 }
      );
    }

    const [newMenu] = await db
      .insert(menus)
      .values({
        name,
        categoryId: categoryId || null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ menu: newMenu }, { status: 201 });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu" },
      { status: 500 }
    );
  }
}
