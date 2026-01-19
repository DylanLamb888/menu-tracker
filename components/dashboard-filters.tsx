"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, X } from "lucide-react";

type VersionStatus = "draft" | "in_review" | "approved" | "live" | "archived" | null;

interface Tag {
  id: string;
  name: string;
  colour: string;
}

interface Menu {
  id: string;
  name: string;
  category: string | null;
  currentStatus: VersionStatus;
  updatedAt: Date;
  needsAttention: boolean;
  tags: Tag[];
}

interface DashboardFiltersProps {
  menus: Menu[];
  categories: string[];
  isAdmin: boolean;
}

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
];

export function DashboardFilters({ menus, categories, isAdmin }: DashboardFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const hasFilters = searchQuery || categoryFilter || statusFilter;

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      // Search filter
      if (searchQuery && !menu.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter && menu.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && menu.currentStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [menus, searchQuery, categoryFilter, statusFilter]);

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("");
    setStatusFilter("");
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3D2E2E]/40" />
          <Input
            placeholder="Search menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-[#3D2E2E]/20 focus:border-[#E07A5F] focus:ring-[#E07A5F]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-[#3D2E2E]/20 bg-white px-3 text-sm text-[#3D2E2E] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-[#3D2E2E]/20 bg-white px-3 text-sm text-[#3D2E2E] focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-[#E07A5F]/10 p-4 mb-4">
            <FileText className="h-8 w-8 text-[#E07A5F]" />
          </div>
          {hasFilters ? (
            <>
              <h3 className="text-lg font-medium text-[#3D2E2E]">No matching menus</h3>
              <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4 border-[#3D2E2E]/20"
              >
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-[#3D2E2E]">No menus yet</h3>
              <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm text-pretty">
                Get started by creating your first menu to begin tracking versions.
              </p>
              {isAdmin && (
                <Link href="/menus/new">
                  <Button className="mt-4 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Menu
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {hasFilters && (
            <p className="text-sm text-[#3D2E2E]/60">
              Showing {filteredMenus.length} of {menus.length} menus
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenus.map((menu) => (
              <MenuCard
                key={menu.id}
                id={menu.id}
                name={menu.name}
                category={menu.category}
                currentStatus={menu.currentStatus}
                updatedAt={menu.updatedAt}
                needsAttention={menu.needsAttention}
                tags={menu.tags}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
