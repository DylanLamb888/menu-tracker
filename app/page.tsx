import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, menus, versions, categories } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

async function getMenusWithDetails() {
  // Use a single query with subqueries to avoid N+1
  const result = await db
    .select({
      id: menus.id,
      name: menus.name,
      updatedAt: menus.updatedAt,
      categoryName: categories.name,
      // Subquery for latest version status
      latestStatus: sql<string | null>`(
        SELECT ${versions.status}
        FROM ${versions}
        WHERE ${versions.menuId} = ${menus.id}
        ORDER BY ${versions.createdAt} DESC
        LIMIT 1
      )`.as("latest_status"),
    })
    .from(menus)
    .leftJoin(categories, eq(menus.categoryId, categories.id))
    .where(eq(menus.isArchived, false))
    .orderBy(desc(menus.updatedAt));

  return result.map((menu) => ({
    id: menu.id,
    name: menu.name,
    category: menu.categoryName,
    currentStatus: menu.latestStatus as "draft" | "in_review" | "approved" | "live" | "archived" | null,
    updatedAt: menu.updatedAt,
  }));
}

export default async function DashboardPage() {
  // Start both fetches in parallel, await late
  const userPromise = getCurrentUser();
  const menusPromise = getMenusWithDetails();

  const user = await userPromise;
  if (!user) {
    redirect("/login");
  }

  const menusList = await menusPromise;

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
            <Link href="/menus/new">
              <Button className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Menu
              </Button>
            </Link>
          )}
        </div>

        {menusList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[#E07A5F]/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-[#E07A5F]" />
            </div>
            <h3 className="text-lg font-medium text-[#3D2E2E]">No menus yet</h3>
            <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm text-pretty">
              Get started by creating your first menu to begin tracking versions.
            </p>
            {user.role === "admin" && (
              <Link href="/menus/new">
                <Button className="mt-4 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Menu
                </Button>
              </Link>
            )}
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
