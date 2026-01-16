import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, menus, versions, categories } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

async function getMenusWithDetails() {
  const allMenus = await db
    .select({
      id: menus.id,
      name: menus.name,
      categoryId: menus.categoryId,
      updatedAt: menus.updatedAt,
    })
    .from(menus)
    .where(eq(menus.isArchived, false))
    .orderBy(desc(menus.updatedAt));

  const menusWithDetails = await Promise.all(
    allMenus.map(async (menu) => {
      let categoryName: string | null = null;
      if (menu.categoryId) {
        const [category] = await db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, menu.categoryId))
          .limit(1);
        categoryName = category?.name || null;
      }

      const [latestVersion] = await db
        .select({ status: versions.status })
        .from(versions)
        .where(eq(versions.menuId, menu.id))
        .orderBy(desc(versions.createdAt))
        .limit(1);

      return {
        id: menu.id,
        name: menu.name,
        category: categoryName,
        currentStatus: latestVersion?.status || null,
        updatedAt: menu.updatedAt,
      };
    })
  );

  return menusWithDetails;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const menusList = await getMenusWithDetails();

  return (
    <AppShell userName={user.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#3D2E2E]">Menus</h2>
            <p className="text-sm text-[#3D2E2E]/70 mt-1">
              Manage your restaurant menus and versions
            </p>
          </div>
          {user.role === "admin" && (
            <Button className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Menu
            </Button>
          )}
        </div>

        {menusList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[#E07A5F]/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-[#E07A5F]" />
            </div>
            <h3 className="text-lg font-medium text-[#3D2E2E]">No menus yet</h3>
            <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm">
              Get started by creating your first menu to begin tracking versions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menusList.map((menu) => (
              <MenuCard
                key={menu.id}
                id={menu.id}
                name={menu.name}
                category={menu.category}
                currentStatus={menu.currentStatus}
                updatedAt={menu.updatedAt}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
