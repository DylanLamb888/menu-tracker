import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db, menus, versions, categories } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { DashboardFilters } from "@/components/dashboard-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

async function getMenusWithDetails(currentUserId: string) {
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
      // Subquery to check if any version is assigned to current user
      hasAssignedVersion: sql<boolean>`EXISTS (
        SELECT 1 FROM ${versions}
        WHERE ${versions.menuId} = ${menus.id}
        AND ${versions.assignedTo} = ${currentUserId}
        AND ${versions.status} NOT IN ('live', 'archived')
      )`.as("has_assigned_version"),
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
    needsAttention: menu.hasAssignedVersion,
  }));
}

async function getCategories() {
  const result = await db
    .select({ name: categories.name })
    .from(categories)
    .orderBy(categories.sortOrder);

  return result.map((c) => c.name);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch menus and categories in parallel
  const [menusList, categoryList] = await Promise.all([
    getMenusWithDetails(user.id),
    getCategories(),
  ]);

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

        <DashboardFilters
          menus={menusList}
          categories={categoryList}
          isAdmin={user.role === "admin"}
        />
      </div>
    </AppShell>
  );
}
