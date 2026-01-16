"use client";

import { useState } from "react";
import { CommentInput } from "@/components/comment-input";
import { CommentsList } from "@/components/comments-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface CommentsSectionProps {
  versionId: string;
}

export function CommentsSection({ versionId }: CommentsSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleCommentAdded() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <Card className="border-[#3D2E2E]/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#3D2E2E]/70 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentInput versionId={versionId} onCommentAdded={handleCommentAdded} />
        <div className="border-t border-[#3D2E2E]/10 pt-4">
          <CommentsList versionId={versionId} refreshKey={refreshKey} />
        </div>
      </CardContent>
    </Card>
  );
}
