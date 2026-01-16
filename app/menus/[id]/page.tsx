import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, menus, versions, categories, users } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { VersionList } from "@/components/version-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface MenuDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getMenuWithVersions(menuId: string) {
  const [menu] = await db
    .select({
      id: menus.id,
      name: menus.name,
      categoryId: menus.categoryId,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
    })
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menu) return null;

  let categoryName: string | null = null;
  if (menu.categoryId) {
    const [category] = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, menu.categoryId))
      .limit(1);
    categoryName = category?.name || null;
  }

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
    })
    .from(versions)
    .where(eq(versions.menuId, menuId))
    .orderBy(desc(versions.createdAt));

  const versionsWithUploader = await Promise.all(
    versionRows.map(async (version) => {
      const [uploader] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, version.uploadedBy))
        .limit(1);

      return {
        ...version,
        uploadedByName: uploader?.name || "Unknown",
      };
    })
  );

  return {
    ...menu,
    category: categoryName,
    versions: versionsWithUploader,
  };
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const menu = await getMenuWithVersions(id);

  if (!menu) {
    notFound();
  }

  return (
    <AppShell userName={user.name}>
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

        <div>
          <h3 className="text-lg font-medium text-[#3D2E2E] mb-4">Versions</h3>
          <VersionList versions={menu.versions} menuId={id} />
        </div>
      </div>
    </AppShell>
  );
}
