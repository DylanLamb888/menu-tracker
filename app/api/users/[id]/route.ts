import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

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
    const { name, role, password, isActive } = body;

    // Check if target user exists
    const [targetUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (name !== undefined) {
      // Check for duplicate name
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.name, name))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        return NextResponse.json(
          { error: "A user with this name already exists" },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (role !== undefined) {
      const validRoles = ["admin", "designer", "approver", "reviewer", "contributor"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }

    if (password !== undefined) {
      updates.passwordHash = await hashPassword(password);
    }

    if (isActive !== undefined) {
      // Prevent admin from deactivating themselves
      if (id === user.id && !isActive) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 }
        );
      }
      updates.isActive = isActive;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
