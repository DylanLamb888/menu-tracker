import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  // Only admin can see inactive users
  if (includeInactive && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = includeInactive
    ? db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.name)
    : db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(users.name);

  const userList = await query;

  return NextResponse.json({ users: userList });
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
    const { name, password, role } = body;

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: "Name, password, and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "designer", "approver", "reviewer", "contributor"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user with same name exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this name already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
