import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, versions, menus, users, itemChanges } from "@/lib/db";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "@/components/status-actions";
import { LazyPdfViewer } from "@/components/pdf-viewer-lazy";
import { AssignmentSelector } from "@/components/assignment-selector";
import { CommentsSection } from "@/components/comments-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, User, Calendar, FileText, GitBranch } from "lucide-react";

interface VersionDetailPageProps {
  params: Promise<{ id: string; versionId: string }>;
}

async function getVersionWithDetails(versionId: string) {
  const [version] = await db
    .select({
      id: versions.id,
      versionLabel: versions.versionLabel,
      status: versions.status,
      pdfUrl: versions.pdfUrl,
      pdfFilename: versions.pdfFilename,
      reasonForChange: versions.reasonForChange,
      changeSummary: versions.changeSummary,
      createdAt: versions.createdAt,
      uploadedBy: versions.uploadedBy,
      assignedTo: versions.assignedTo,
      menuId: versions.menuId,
      parentVersionId: versions.parentVersionId,
    })
    .from(versions)
    .where(eq(versions.id, versionId))
    .limit(1);

  if (!version) return null;

  // Fetch menu, uploader, assignee, parent version, and item changes in parallel
  const [menu, uploader, assignee, parentVersion, changes] = await Promise.all([
    db
      .select({ id: menus.id, name: menus.name })
      .from(menus)
      .where(eq(menus.id, version.menuId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, version.uploadedBy))
      .limit(1)
      .then((rows) => rows[0]),
    version.assignedTo
      ? db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, version.assignedTo))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(null),
    version.parentVersionId
      ? db
          .select({ id: versions.id, versionLabel: versions.versionLabel })
          .from(versions)
          .where(eq(versions.id, version.parentVersionId))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(null),
    db
      .select({
        id: itemChanges.id,
        itemName: itemChanges.itemName,
        oldValue: itemChanges.oldValue,
        newValue: itemChanges.newValue,
      })
      .from(itemChanges)
      .where(eq(itemChanges.versionId, versionId)),
  ]);

  return {
    ...version,
    menu,
    uploaderName: uploader?.name || "Unknown",
    assigneeName: assignee?.name || null,
    parentVersion: parentVersion || null,
    itemChanges: changes,
  };
}

export default async function VersionDetailPage({
  params,
}: VersionDetailPageProps) {
  const userPromise = getCurrentUser();
  const { id: menuId, versionId } = await params;

  const versionPromise = getVersionWithDetails(versionId);

  const user = await userPromise;
  if (!user) {
    redirect("/login");
  }

  const version = await versionPromise;
  if (!version || version.menuId !== menuId) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(version.createdAt));

  return (
    <AppShell userName={user.name}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#3D2E2E]/70">
          <Link href="/" className="hover:text-[#3D2E2E]">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/menus/${menuId}`} className="hover:text-[#3D2E2E]">
            {version.menu?.name || "Menu"}
          </Link>
          <span>/</span>
          <span className="text-[#3D2E2E] font-medium">
            {version.versionLabel}
          </span>
        </div>

        {/* Back button */}
        <Link href={`/menus/${menuId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#3D2E2E]/70 hover:text-[#3D2E2E] -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {version.menu?.name || "Menu"}
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#3D2E2E] font-mono">
                {version.versionLabel}
              </h1>
              <StatusBadge status={version.status} />
            </div>
            <p className="text-sm text-[#3D2E2E]/70 mt-1">
              {version.pdfFilename}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusActions
              versionId={version.id}
              currentStatus={version.status}
              userRole={user.role}
            />
            <Link href={`/menus/${menuId}/new-version?from=${version.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
              >
                <GitBranch className="h-4 w-4 mr-1" />
                Branch
              </Button>
            </Link>
          </div>
        </div>

        {/* Two column layout on desktop */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PDF Viewer - takes 2 columns */}
          <div className="lg:col-span-2">
            <LazyPdfViewer url={version.pdfUrl} filename={version.pdfFilename} />
          </div>

          {/* Metadata sidebar */}
          <div className="space-y-4">
            <Card className="border-[#3D2E2E]/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#3D2E2E]/70">
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[#3D2E2E]/50" />
                  <span className="text-[#3D2E2E]/70">Uploaded by</span>
                  <span className="text-[#3D2E2E] font-medium">
                    {version.uploaderName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[#3D2E2E]/50" />
                  <span className="text-[#3D2E2E]/70">Created</span>
                  <span className="text-[#3D2E2E]">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-[#3D2E2E]/50" />
                  <span className="text-[#3D2E2E]/70">File</span>
                  <span className="text-[#3D2E2E] truncate">
                    {version.pdfFilename}
                  </span>
                </div>
                {version.parentVersion && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-[#3D2E2E]/50" />
                    <span className="text-[#3D2E2E]/70">Branched from</span>
                    <Link
                      href={`/menus/${menuId}/versions/${version.parentVersion.id}`}
                      className="text-[#E07A5F] hover:underline font-mono font-medium"
                    >
                      {version.parentVersion.versionLabel}
                    </Link>
                  </div>
                )}
                <div className="border-t border-[#3D2E2E]/10 pt-4">
                  <AssignmentSelector
                    versionId={version.id}
                    currentAssigneeId={version.assignedTo}
                    currentAssigneeName={version.assigneeName}
                    userRole={user.role}
                  />
                </div>
              </CardContent>
            </Card>

            {(version.reasonForChange || version.changeSummary) && (
              <Card className="border-[#3D2E2E]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#3D2E2E]/70">
                    Change Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {version.reasonForChange && (
                    <div>
                      <p className="text-xs text-[#3D2E2E]/50 uppercase tracking-wide mb-1">
                        Reason
                      </p>
                      <p className="text-sm text-[#3D2E2E]">
                        {version.reasonForChange}
                      </p>
                    </div>
                  )}
                  {version.changeSummary && (
                    <div>
                      <p className="text-xs text-[#3D2E2E]/50 uppercase tracking-wide mb-1">
                        Summary
                      </p>
                      <p className="text-sm text-[#3D2E2E]">
                        {version.changeSummary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {version.itemChanges.length > 0 && (
              <Card className="border-[#3D2E2E]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#3D2E2E]/70">
                    Item Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {version.itemChanges.map((change) => (
                      <div
                        key={change.id}
                        className="p-2 bg-[#3D2E2E]/5 rounded text-sm"
                      >
                        <p className="font-medium text-[#3D2E2E]">
                          {change.itemName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[#3D2E2E]/70">
                          {change.oldValue && (
                            <span className="line-through">
                              {change.oldValue}
                            </span>
                          )}
                          {change.oldValue && change.newValue && (
                            <ArrowRight className="h-3 w-3" />
                          )}
                          {change.newValue && (
                            <span className="text-[#10B981] font-medium">
                              {change.newValue}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Comments section - full width */}
        <CommentsSection versionId={version.id} />
      </div>
    </AppShell>
  );
}
