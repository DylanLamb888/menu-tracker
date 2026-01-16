import { useMemo } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, Star, GitBranch } from "lucide-react";

type VersionStatus = "draft" | "in_review" | "approved" | "live" | "archived";

interface Version {
  id: string;
  versionLabel: string;
  status: VersionStatus;
  createdAt: Date;
  uploadedByName: string;
  assignedTo: string | null;
  assignedToName: string | null;
  parentVersionId: string | null;
}

interface VersionTreeProps {
  versions: Version[];
  menuId: string;
  currentUserId: string;
}

const statusColors: Record<VersionStatus, string> = {
  draft: "bg-gray-400",
  in_review: "bg-amber-500",
  approved: "bg-emerald-500",
  live: "bg-[#E07A5F]",
  archived: "bg-gray-300",
};

// Hoist static JSX and formatters outside component
const emptyState = (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-[#E07A5F]/10 p-4 mb-4">
      <FileText className="h-8 w-8 text-[#E07A5F]" />
    </div>
    <h3 className="text-lg font-medium text-[#3D2E2E]">No versions yet</h3>
    <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm">
      Upload your first PDF to start tracking versions.
    </p>
  </div>
);

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function VersionTree({
  versions,
  menuId,
  currentUserId,
}: VersionTreeProps) {
  // Memoize the version map for O(1) lookups
  const versionMap = useMemo(
    () => new Map(versions.map((v) => [v.id, v])),
    [versions]
  );

  if (versions.length === 0) {
    return emptyState;
  }

  // Identify branches: version whose parent is not the immediately previous version (by index)
  // Versions are sorted by createdAt desc, so index 0 is newest
  function getBranchParent(version: Version, index: number): Version | null {
    if (!version.parentVersionId) return null;

    // If there's a next version in the list (older), check if this version's parent is that version
    const olderVersion = versions[index + 1];
    if (olderVersion && version.parentVersionId === olderVersion.id) {
      // Normal linear progression, not a branch
      return null;
    }

    // This is a branch - find and return the parent
    const parent = versionMap.get(version.parentVersionId);
    return parent || null;
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#3D2E2E]/10" />

      <div className="space-y-4">
        {versions.map((version, index) => {
          const isLive = version.status === "live";
          const isAssignedToMe = version.assignedTo === currentUserId;
          const branchParent = getBranchParent(version, index);
          const formattedDate = dateFormatter.format(new Date(version.createdAt));

          return (
            <Link
              key={version.id}
              href={`/menus/${menuId}/versions/${version.id}`}
              className="block"
            >
              <div
                className={`relative flex items-start gap-4 p-3 rounded-lg hover:bg-[#3D2E2E]/5 transition-colors ${
                  isAssignedToMe ? "ring-2 ring-[#E07A5F]/50 bg-[#E07A5F]/5" : ""
                }`}
              >
                {/* Timeline node */}
                <div className="relative z-10 flex-shrink-0">
                  {branchParent && (
                    <div className="absolute -left-2 top-1/2 w-3 h-0.5 bg-[#E07A5F]/50" />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full ${statusColors[version.status]} flex items-center justify-center ${
                      isLive ? "ring-4 ring-[#E07A5F]/30" : ""
                    } ${branchParent ? "ring-2 ring-[#E07A5F]/30" : ""}`}
                  >
                    {isLive ? (
                      <Star className="h-4 w-4 text-white fill-white" />
                    ) : branchParent ? (
                      <GitBranch className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[#3D2E2E]">
                      {version.versionLabel}
                    </span>
                    <StatusBadge status={version.status} />
                    {isLive && (
                      <Badge className="bg-[#E07A5F] text-white text-xs">
                        Current
                      </Badge>
                    )}
                    {isAssignedToMe && (
                      <Badge
                        variant="outline"
                        className="border-[#E07A5F] text-[#E07A5F] bg-[#E07A5F]/5"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Your turn
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#3D2E2E]/60 flex-wrap">
                    <span>{formattedDate}</span>
                    <span>&bull;</span>
                    <span>by {version.uploadedByName}</span>
                    {version.assignedToName && (
                      <>
                        <span>&bull;</span>
                        <span>assigned to {version.assignedToName}</span>
                      </>
                    )}
                    {branchParent && (
                      <>
                        <span>&bull;</span>
                        <span className="inline-flex items-center gap-1 text-[#E07A5F]">
                          <GitBranch className="h-3 w-3" />
                          from {branchParent.versionLabel}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 text-[#3D2E2E]/30">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
