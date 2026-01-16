"use client";

import { useState } from "react";
import { VersionList } from "@/components/version-list";
import { VersionTree } from "@/components/version-tree";
import { Button } from "@/components/ui/button";
import { List, GitBranch } from "lucide-react";

type VersionStatus = "draft" | "in_review" | "approved" | "live" | "archived";
type UserRole = "admin" | "designer" | "approver" | "reviewer" | "contributor";

interface Version {
  id: string;
  versionLabel: string;
  status: VersionStatus;
  pdfUrl: string;
  pdfFilename: string;
  reasonForChange: string | null;
  changeSummary: string | null;
  createdAt: Date;
  uploadedByName: string;
  assignedTo: string | null;
  assignedToName: string | null;
  parentVersionId: string | null;
}

interface VersionViewsProps {
  versions: Version[];
  menuId: string;
  userRole: UserRole;
  currentUserId: string;
}

type ViewMode = "list" | "tree";

export function VersionViews({
  versions,
  menuId,
  userRole,
  currentUserId,
}: VersionViewsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[#3D2E2E]">Versions</h3>
        <div className="flex items-center gap-1 bg-[#3D2E2E]/5 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("tree")}
            className={`h-8 px-3 ${
              viewMode === "tree"
                ? "bg-white shadow-sm text-[#3D2E2E]"
                : "text-[#3D2E2E]/60 hover:text-[#3D2E2E]"
            }`}
          >
            <GitBranch className="h-4 w-4 mr-1.5" />
            Timeline
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`h-8 px-3 ${
              viewMode === "list"
                ? "bg-white shadow-sm text-[#3D2E2E]"
                : "text-[#3D2E2E]/60 hover:text-[#3D2E2E]"
            }`}
          >
            <List className="h-4 w-4 mr-1.5" />
            Details
          </Button>
        </div>
      </div>

      {viewMode === "tree" ? (
        <VersionTree
          versions={versions}
          menuId={menuId}
          currentUserId={currentUserId}
        />
      ) : (
        <VersionList
          versions={versions}
          menuId={menuId}
          userRole={userRole}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
