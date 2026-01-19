import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, menus, versions, categories, users } from "@/lib/db";
import { eq, desc, inArray } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { VersionViews } from "@/components/version-views";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getMenuWithVersions(menuId: string) {
  // Fetch menu with category in single query
  const [menuWithCategory] = await db
    .select({
      id: menus.id,
      name: menus.name,
      categoryName: categories.name,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
    })
    .from(menus)
    .leftJoin(categories, eq(menus.categoryId, categories.id))
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menuWithCategory) return null;

  // Fetch all versions for this menu
  const versionRows = await db
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
      parentVersionId: versions.parentVersionId,
    })
    .from(versions)
    .where(eq(versions.menuId, menuId))
    .orderBy(desc(versions.createdAt));

  // Batch fetch all uploaders and assignees in one query
  const userIds = [
    ...new Set([
      ...versionRows.map((v) => v.uploadedBy),
      ...versionRows.map((v) => v.assignedTo).filter(Boolean) as string[],
    ]),
  ];
  const userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const usersList = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, userIds));

    usersList.forEach((u) => userMap.set(u.id, u.name));
  }

  const versionsWithDetails = versionRows.map((version) => ({
    id: version.id,
    versionLabel: version.versionLabel,
    status: version.status,
    pdfUrl: version.pdfUrl,
    pdfFilename: version.pdfFilename,
    reasonForChange: version.reasonForChange,
    changeSummary: version.changeSummary,
    createdAt: version.createdAt,
    uploadedBy: version.uploadedBy,
    assignedTo: version.assignedTo,
    parentVersionId: version.parentVersionId,
    uploadedByName: userMap.get(version.uploadedBy) || "Unknown",
    assignedToName: version.assignedTo ? userMap.get(version.assignedTo) || null : null,
  }));

  return {
    id: menuWithCategory.id,
    name: menuWithCategory.name,
    category: menuWithCategory.categoryName,
    createdAt: menuWithCategory.createdAt,
    updatedAt: menuWithCategory.updatedAt,
    versions: versionsWithDetails,
  };
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  // Start user fetch early, await late
  const userPromise = getCurrentUser();
  const { id } = await params;

  // Start menu fetch in parallel
  const menuPromise = getMenuWithVersions(id);

  const user = await userPromise;
  if (!user) {
    redirect("/login");
  }

  const menu = await menuPromise;
  if (!menu) {
    notFound();
  }

  return (
    <AppShell userName={user.name} userRole={user.role}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#3D2E2E]">{menu.name}</h2>
            {menu.category && (
              <p className="text-sm text-[#3D2E2E]/70 mt-1">{menu.category}</p>
            )}
          </div>
          <Link href={`/menus/${id}/new-version`}>
            <Button className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Version
            </Button>
          </Link>
        </div>

        <VersionViews
          versions={menu.versions}
          menuId={id}
          userRole={user.role}
          currentUserId={user.id}
        />
      </div>
    </AppShell>
  );
}
