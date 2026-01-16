import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "@/components/status-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, UserCircle, AlertCircle } from "lucide-react";

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

interface VersionListProps {
  versions: Version[];
  menuId: string;
  userRole: UserRole;
  currentUserId: string;
}

export function VersionList({ versions, menuId, userRole, currentUserId }: VersionListProps) {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-[#E07A5F]/10 p-4 mb-4">
          <FileText className="h-8 w-8 text-[#E07A5F]" />
        </div>
        <h3 className="text-lg font-medium text-[#3D2E2E]">No versions yet</h3>
        <p className="text-sm text-[#3D2E2E]/70 mt-1 max-w-sm">
          Upload your first PDF to create the first version of this menu.
        </p>
        <Link href={`/menus/${menuId}/new-version`}>
          <Button className="mt-4 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white">
            Upload First Version
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => {
        const formattedDate = new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(version.createdAt));

        const isAssignedToMe = version.assignedTo === currentUserId;

        return (
          <Card key={version.id} className={`border-[#3D2E2E]/10 ${isAssignedToMe ? "ring-2 ring-[#E07A5F]/50" : ""}`}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#E07A5F]/10 p-2">
                      <FileText className="h-5 w-5 text-[#E07A5F]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-[#3D2E2E] tabular-nums">
                          {version.versionLabel}
                        </span>
                        <StatusBadge status={version.status} />
                        {isAssignedToMe && (
                          <Badge variant="outline" className="border-[#E07A5F] text-[#E07A5F] bg-[#E07A5F]/5">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Your turn
                          </Badge>
                        )}
                      </div>
                      {version.assignedToName && (
                        <div className="flex items-center gap-1 text-xs text-[#3D2E2E]/60 mt-0.5">
                          <UserCircle className="h-3 w-3" />
                          Assigned to {version.assignedToName}
                        </div>
                      )}
                      <p className="text-sm text-[#3D2E2E]/70 mt-1 truncate max-w-xs">
                        {version.pdfFilename}
                      </p>
                      {version.reasonForChange && (
                        <p className="text-sm text-[#3D2E2E]/70 mt-1 line-clamp-2">
                          <span className="font-medium">Reason:</span> {version.reasonForChange}
                        </p>
                      )}
                      {version.changeSummary && (
                        <p className="text-sm text-[#3D2E2E]/70 mt-1 line-clamp-2">
                          <span className="font-medium">Summary:</span> {version.changeSummary}
                        </p>
                      )}
                      <p className="text-xs text-[#3D2E2E]/50 mt-2">
                        Uploaded by {version.uploadedByName} on {formattedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/menus/${menuId}/versions/${version.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <a href={version.pdfUrl} download={version.pdfFilename}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
                <div className="border-t border-[#3D2E2E]/10 pt-3">
                  <StatusActions
                    versionId={version.id}
                    currentStatus={version.status}
                    userRole={userRole}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
