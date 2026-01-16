import { NextResponse } from "next/server";
import { db, comments, users, activityLogs, commentMentions } from "@/lib/db";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;

  // Fetch comments with author names
  const commentRows = await db
    .select({
      id: comments.id,
      content: comments.content,
      category: comments.category,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.versionId, versionId))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json({
    comments: commentRows.map((c) => ({
      id: c.id,
      content: c.content,
      category: c.category,
      createdAt: c.createdAt,
      authorId: c.authorId,
      authorName: c.authorName || "Unknown",
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;

  try {
    const body = await request.json();
    const { content, category } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const validCategories = ["content", "design", "pricing", "other"];
    const commentCategory = validCategories.includes(category) ? category : "other";

    const [newComment] = await db
      .insert(comments)
      .values({
        versionId,
        authorId: user.id,
        content: content.trim(),
        category: commentCategory,
      })
      .returning();

    // Parse @mentions from content
    const mentionMatches = content.match(/@(\w+(?:\s+\w+)*)/g);
    const mentionedNames = mentionMatches
      ? mentionMatches.map((m: string) => m.slice(1).trim())
      : [];

    // Look up user IDs for mentioned names and insert into comment_mentions
    if (mentionedNames.length > 0) {
      const mentionedUsers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.name, mentionedNames));

      if (mentionedUsers.length > 0) {
        await db.insert(commentMentions).values(
          mentionedUsers.map((u) => ({
            commentId: newComment.id,
            userId: u.id,
          }))
        );
      }
    }

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: "comment_added",
      targetType: "version",
      targetId: versionId,
      metadata: {
        commentId: newComment.id,
        category: commentCategory,
        mentionedUsers: mentionedNames,
      },
    });

    return NextResponse.json(
      {
        comment: {
          ...newComment,
          authorName: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
