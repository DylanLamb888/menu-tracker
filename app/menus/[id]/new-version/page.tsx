"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PdfUpload } from "@/components/pdf-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function NewVersionPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
              Upload New Version
            </CardTitle>
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
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g., Added 3 new dishes, updated pricing"
                  className="border-[#3D2E2E]/20 focus:border-[#E07A5F] focus:ring-[#E07A5F]"
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
