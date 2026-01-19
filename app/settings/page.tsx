import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/user-management";
import { CategoryManagement } from "@/components/category-management";
import { TagManagement } from "@/components/tag-management";
import { Users, FolderTree, Tag } from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Only admin can access settings
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <AppShell userName={user.name} userRole={user.role}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#3D2E2E]">Settings</h2>
          <p className="text-sm text-[#3D2E2E]/70 mt-1">
            Manage users, categories, and tags
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border border-[#3D2E2E]/10">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-[#E07A5F]/10 data-[state=active]:text-[#E07A5F]"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-[#E07A5F]/10 data-[state=active]:text-[#E07A5F]"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="data-[state=active]:bg-[#E07A5F]/10 data-[state=active]:text-[#E07A5F]"
            >
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <div className="rounded-lg border border-[#3D2E2E]/10 bg-white p-6">
              <UserManagement />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <div className="rounded-lg border border-[#3D2E2E]/10 bg-white p-6">
              <CategoryManagement />
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <div className="rounded-lg border border-[#3D2E2E]/10 bg-white p-6">
              <TagManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
