import { NextResponse } from "next/server";
import { db, annotations, users, activityLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { canAnnotate, isAdmin } from "@/lib/permissions";
import type { AnnotationData, AnnotationTool } from "@/lib/annotation-types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;
  const { searchParams } = new URL(request.url);
  const pageNumber = searchParams.get("page");

  const conditions = [eq(annotations.versionId, versionId)];
  if (pageNumber) {
    conditions.push(eq(annotations.pageNumber, parseInt(pageNumber, 10)));
  }

  const annotationRows = await db
    .select({
      id: annotations.id,
      versionId: annotations.versionId,
      pageNumber: annotations.pageNumber,
      authorId: annotations.authorId,
      authorName: users.name,
      tool: annotations.tool,
      color: annotations.color,
      data: annotations.data,
      createdAt: annotations.createdAt,
    })
    .from(annotations)
    .leftJoin(users, eq(annotations.authorId, users.id))
    .where(and(...conditions));

  return NextResponse.json({
    annotations: annotationRows.map((a) => ({
      id: a.id,
      versionId: a.versionId,
      pageNumber: a.pageNumber,
      authorId: a.authorId,
      authorName: a.authorName || "Unknown",
      tool: a.tool,
      color: a.color,
      data: a.data as AnnotationData,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAnnotate(user.role)) {
    return NextResponse.json(
      { error: "You do not have permission to add annotations" },
      { status: 403 }
    );
  }

  const { id: versionId } = await context.params;

  try {
    const body = await request.json();
    const { pageNumber, tool, color, data } = body;

    if (typeof pageNumber !== "number" || pageNumber < 1) {
      return NextResponse.json(
        { error: "Valid page number is required" },
        { status: 400 }
      );
    }

    const validTools: AnnotationTool[] = ["pen", "text", "checkmark", "highlight"];
    if (!validTools.includes(tool)) {
      return NextResponse.json(
        { error: "Invalid annotation tool" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Annotation data is required" },
        { status: 400 }
      );
    }

    const [newAnnotation] = await db
      .insert(annotations)
      .values({
        versionId,
        pageNumber,
        authorId: user.id,
        tool,
        color: color || "#E07A5F",
        data,
      })
      .returning();

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "annotation_added",
      targetType: "version",
      targetId: versionId,
      metadata: {
        annotationId: newAnnotation.id,
        tool,
        pageNumber,
      },
    });

    return NextResponse.json(
      {
        annotation: {
          ...newAnnotation,
          authorName: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create annotation error:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;
  const { searchParams } = new URL(request.url);
  const annotationId = searchParams.get("annotationId");

  if (!annotationId) {
    return NextResponse.json(
      { error: "annotationId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the annotation to verify ownership
    const [annotation] = await db
      .select()
      .from(annotations)
      .where(
        and(
          eq(annotations.id, annotationId),
          eq(annotations.versionId, versionId)
        )
      );

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    if (annotation.authorId !== user.id && !isAdmin(user.role)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this annotation" },
        { status: 403 }
      );
    }

    await db.delete(annotations).where(eq(annotations.id, annotationId));

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "annotation_deleted",
      targetType: "version",
      targetId: versionId,
      metadata: {
        annotationId,
        tool: annotation.tool,
        pageNumber: annotation.pageNumber,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete annotation error:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: versionId } = await context.params;

  try {
    const body = await request.json();
    const { annotationId, data } = body;

    if (!annotationId) {
      return NextResponse.json(
        { error: "annotationId is required" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "data is required" },
        { status: 400 }
      );
    }

    // Fetch the annotation to verify ownership
    const [annotation] = await db
      .select()
      .from(annotations)
      .where(
        and(
          eq(annotations.id, annotationId),
          eq(annotations.versionId, versionId)
        )
      );

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Only author or admin can update
    if (annotation.authorId !== user.id && !isAdmin(user.role)) {
      return NextResponse.json(
        { error: "You do not have permission to update this annotation" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(annotations)
      .set({ data })
      .where(eq(annotations.id, annotationId))
      .returning();

    return NextResponse.json({
      annotation: {
        ...updated,
        authorName: user.name,
      },
    });
  } catch (error) {
    console.error("Update annotation error:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}
