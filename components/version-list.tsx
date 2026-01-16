import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

interface Version {
  id: string;
  versionLabel: string;
  status: "draft" | "in_review" | "approved" | "live" | "archived";
  pdfUrl: string;
  pdfFilename: string;
  reasonForChange: string | null;
  changeSummary: string | null;
  createdAt: Date;
  uploadedByName: string;
}

interface VersionListProps {
  versions: Version[];
  menuId: string;
}

export function VersionList({ versions, menuId }: VersionListProps) {
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

        return (
          <Card key={version.id} className="border-[#3D2E2E]/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#E07A5F]/10 p-2">
                    <FileText className="h-5 w-5 text-[#E07A5F]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-[#3D2E2E]">
                        {version.versionLabel}
                      </span>
                      <StatusBadge status={version.status} />
                    </div>
                    <p className="text-sm text-[#3D2E2E]/70 mt-1">
                      {version.pdfFilename}
                    </p>
                    {version.reasonForChange && (
                      <p className="text-sm text-[#3D2E2E]/70 mt-1">
                        <span className="font-medium">Reason:</span> {version.reasonForChange}
                      </p>
                    )}
                    {version.changeSummary && (
                      <p className="text-sm text-[#3D2E2E]/70 mt-1">
                        <span className="font-medium">Summary:</span> {version.changeSummary}
                      </p>
                    )}
                    <p className="text-xs text-[#3D2E2E]/50 mt-2">
                      Uploaded by {version.uploadedByName} on {formattedDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={version.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </a>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
