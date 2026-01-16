"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PdfViewer),
  {
    loading: () => (
      <div className="flex flex-col border border-[#3D2E2E]/10 rounded-lg overflow-hidden bg-[#3D2E2E]/5">
        <div className="flex items-center justify-center p-2 border-b border-[#3D2E2E]/10 bg-white h-12">
          <span className="text-sm text-[#3D2E2E]/50">Loading viewer...</span>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E07A5F] border-t-transparent" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

interface LazyPdfViewerProps {
  url: string;
  filename: string;
}

export function LazyPdfViewer({ url, filename }: LazyPdfViewerProps) {
  return <PdfViewer url={url} filename={filename} />;
}
