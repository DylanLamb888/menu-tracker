"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PdfUpload } from "@/components/pdf-upload";
import { ItemChangesInput, type ItemChange } from "@/components/item-changes-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, GitBranch } from "lucide-react";

interface ParentVersion {
  id: string;
  versionLabel: string;
  status: string;
}

export default function NewVersionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const menuId = params.id as string;
  const fromVersionId = searchParams.get("from");

  const [file, setFile] = useState<File | null>(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [itemChanges, setItemChanges] = useState<ItemChange[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [parentVersion, setParentVersion] = useState<ParentVersion | null>(null);

  // Fetch parent version info if branching
  useEffect(() => {
    if (fromVersionId) {
      fetch(`/api/versions/${fromVersionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.version) {
            setParentVersion({
              id: data.version.id,
              versionLabel: data.version.versionLabel,
              status: data.version.status,
            });
          }
        })
        .catch(() => {
          // Ignore errors, just don't show parent info
        });
    }
  }, [fromVersionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reasonForChange", reasonForChange);
      formData.append("changeSummary", changeSummary);

      // Include parent version ID if branching
      if (fromVersionId) {
        formData.append("parentVersionId", fromVersionId);
      }

      // Filter out empty item changes and send as JSON
      const validChanges = itemChanges.filter(
        (c) => c.itemName.trim() || c.oldValue.trim() || c.newValue.trim()
      );
      if (validChanges.length > 0) {
        formData.append("itemChanges", JSON.stringify(validChanges));
      }

      const response = await fetch(`/api/menus/${menuId}/versions`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload version");
        return;
      }

      router.push(`/menus/${menuId}`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/menus/${menuId}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl border-[#3D2E2E]/10">
          <CardHeader>
            <CardTitle className="text-xl text-[#3D2E2E]">
              {parentVersion ? "Create Branch" : "Upload New Version"}
            </CardTitle>
            {parentVersion && (
              <div className="flex items-center gap-2 mt-2 text-sm text-[#3D2E2E]/70">
                <GitBranch className="h-4 w-4 text-[#E07A5F]" />
                <span>
                  Branching from{" "}
                  <span className="font-mono font-medium text-[#3D2E2E]">
                    {parentVersion.versionLabel}
                  </span>
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#3D2E2E]">PDF File *</Label>
                <PdfUpload onFileSelect={setFile} selectedFile={file} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-[#3D2E2E]">
                  Reason for Change
                </Label>
                <Input
                  id="reason"
                  name="reason"
                  autoComplete="off"
                  value={reasonForChange}
                  onChange={(e) => setReasonForChange(e.target.value)}
                  placeholder="e.g., Seasonal menu update"
                  className="border-[#3D2E2E]/20 focus:border-[#E07A5F] focus:ring-[#E07A5F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-[#3D2E2E]">
                  Change Summary
                </Label>
                <Input
                  id="summary"
                  name="summary"
                  autoComplete="off"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g., Added 3 new dishes, updated pricing"
                  className="border-[#3D2E2E]/20 focus:border-[#E07A5F] focus:ring-[#E07A5F]"
                />
              </div>

              <div className="border-t border-[#3D2E2E]/10 pt-4">
                <ItemChangesInput
                  changes={itemChanges}
                  onChange={setItemChanges}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
                >
                  {isSubmitting ? "Uploading..." : "Upload Version"}
                </Button>
                <Link href={`/menus/${menuId}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#3D2E2E]/20 text-[#3D2E2E]"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
