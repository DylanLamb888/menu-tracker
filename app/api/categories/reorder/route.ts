import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: "Order must be an array of category IDs" },
        { status: 400 }
      );
    }

    // Update sort order for each category
    for (let i = 0; i < order.length; i++) {
      await db
        .update(categories)
        .set({ sortOrder: i })
        .where(eq(categories.id, order[i]));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
