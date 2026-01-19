"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Activity, Settings } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function AppShell({ children, userName, userRole }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-[#FAF7F2]">
      <header className="sticky top-0 z-40 border-b border-[#3D2E2E]/10 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Menu className="h-6 w-6 text-[#E07A5F]" />
              <h1 className="text-xl font-semibold text-[#3D2E2E]">
                Menu Tracker
              </h1>
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    pathname === "/"
                      ? "text-[#E07A5F] bg-[#E07A5F]/10"
                      : "text-[#3D2E2E]/70 hover:text-[#3D2E2E] hover:bg-[#3D2E2E]/5"
                  }`}
                >
                  Menus
                </Button>
              </Link>
              <Link href="/activity">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    pathname === "/activity"
                      ? "text-[#E07A5F] bg-[#E07A5F]/10"
                      : "text-[#3D2E2E]/70 hover:text-[#3D2E2E] hover:bg-[#3D2E2E]/5"
                  }`}
                >
                  <Activity className="h-4 w-4 mr-1.5" />
                  Activity
                </Button>
              </Link>
              {userRole === "admin" && (
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${
                      pathname === "/settings"
                        ? "text-[#E07A5F] bg-[#E07A5F]/10"
                        : "text-[#3D2E2E]/70 hover:text-[#3D2E2E] hover:bg-[#3D2E2E]/5"
                    }`}
                  >
                    <Settings className="h-4 w-4 mr-1.5" />
                    Settings
                  </Button>
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-sm text-[#3D2E2E]/70">{userName}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[#3D2E2E]/70 hover:text-[#3D2E2E] hover:bg-[#3D2E2E]/5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
