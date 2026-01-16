"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User } from "lucide-react";

type CommentCategory = "content" | "design" | "pricing" | "other";

interface Comment {
  id: string;
  content: string;
  category: CommentCategory;
  createdAt: string;
  authorId: string;
  authorName: string;
}

interface CommentsListProps {
  versionId: string;
  refreshKey?: number;
}

const categoryColors: Record<CommentCategory, string> = {
  content: "bg-blue-100 text-blue-800",
  design: "bg-purple-100 text-purple-800",
  pricing: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

const categoryLabels: Record<CommentCategory, string> = {
  content: "Content",
  design: "Design",
  pricing: "Pricing",
  other: "Other",
};

// Highlight @mentions in comment content
function formatContent(content: string): React.ReactNode {
  const parts = content.split(/(@\w+(?:\s+\w+)*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span key={index} className="text-[#E07A5F] font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function CommentsList({ versionId, refreshKey }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/versions/${versionId}/comments`);
        const data = await response.json();

        if (response.ok) {
          setComments(data.comments);
        } else {
          setError(data.error || "Failed to load comments");
        }
      } catch {
        setError("Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    }

    fetchComments();
  }, [versionId, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E07A5F] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 py-4">{error}</p>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-8 w-8 text-[#3D2E2E]/20 mb-2" />
        <p className="text-sm text-[#3D2E2E]/50">No comments yet</p>
        <p className="text-xs text-[#3D2E2E]/40 mt-1">
          Be the first to add a comment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const formattedDate = new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(comment.createdAt));

        return (
          <div
            key={comment.id}
            className="p-3 bg-[#3D2E2E]/5 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-[#3D2E2E]">
                  <User className="h-4 w-4 text-[#3D2E2E]/50" />
                  {comment.authorName}
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${categoryColors[comment.category]}`}
                >
                  {categoryLabels[comment.category]}
                </Badge>
              </div>
              <span className="text-xs text-[#3D2E2E]/50 whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
            <p className="text-sm text-[#3D2E2E] whitespace-pre-wrap">
              {formatContent(comment.content)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
