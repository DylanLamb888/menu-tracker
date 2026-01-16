import { NextResponse } from "next/server";
import { verifyPassword, createSession } from "@/lib/auth";
import { db, activityLogs } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await verifyPassword(password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    await createSession(user.id);

    // Log the login activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: "user_logged_in",
      targetType: "user",
      targetId: user.id,
      metadata: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
