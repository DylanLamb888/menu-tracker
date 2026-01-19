import { NextResponse } from "next/server";
import { db, menus, versions, categories, menuTags, tags } from "@/lib/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Single query with JOIN and subquery - no N+1
  const result = await db
    .select({
      id: menus.id,
      name: menus.name,
      updatedAt: menus.updatedAt,
      categoryName: categories.name,
      latestStatus: sql<string | null>`(
        SELECT ${versions.status}
        FROM ${versions}
        WHERE ${versions.menuId} = ${menus.id}
        ORDER BY ${versions.createdAt} DESC
        LIMIT 1
      )`.as("latest_status"),
    })
    .from(menus)
    .leftJoin(categories, eq(menus.categoryId, categories.id))
    .where(eq(menus.isArchived, false))
    .orderBy(desc(menus.updatedAt));

  // Batch fetch tags for all menus
  const menuIds = result.map((m) => m.id);
  const menuTagsMap = new Map<string, { id: string; name: string; colour: string }[]>();

  if (menuIds.length > 0) {
    const tagResults = await db
      .select({
        menuId: menuTags.menuId,
        tagId: tags.id,
        tagName: tags.name,
        tagColour: tags.colour,
      })
      .from(menuTags)
      .innerJoin(tags, eq(menuTags.tagId, tags.id))
      .where(inArray(menuTags.menuId, menuIds));

    tagResults.forEach((row) => {
      const existing = menuTagsMap.get(row.menuId) || [];
      existing.push({ id: row.tagId, name: row.tagName, colour: row.tagColour });
      menuTagsMap.set(row.menuId, existing);
    });
  }

  const menusWithDetails = result.map((menu) => ({
    id: menu.id,
    name: menu.name,
    category: menu.categoryName,
    currentStatus: menu.latestStatus,
    updatedAt: menu.updatedAt,
    tags: menuTagsMap.get(menu.id) || [],
  }));

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
    const { name, categoryId, tagIds } = await request.json();

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

    // Insert tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(menuTags).values(
        tagIds.map((tagId: string) => ({
          menuId: newMenu.id,
          tagId,
        }))
      );
    }

    return NextResponse.json({ menu: newMenu }, { status: 201 });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu" },
      { status: 500 }
    );
  }
}
