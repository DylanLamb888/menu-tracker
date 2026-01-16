"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAvailableTransitions, getTransitionLabel } from "@/lib/permissions";
import { Send, Check, Play, Archive, X } from "lucide-react";

type VersionStatus = "draft" | "in_review" | "approved" | "live" | "archived";
type UserRole = "admin" | "designer" | "approver" | "reviewer" | "contributor";

interface StatusActionsProps {
  versionId: string;
  currentStatus: VersionStatus;
  userRole: UserRole;
}

const statusIcons: Record<string, React.ReactNode> = {
  "draft:in_review": <Send className="h-4 w-4 mr-1" />,
  "in_review:draft": <X className="h-4 w-4 mr-1" />,
  "in_review:approved": <Check className="h-4 w-4 mr-1" />,
  "approved:live": <Play className="h-4 w-4 mr-1" />,
  "live:archived": <Archive className="h-4 w-4 mr-1" />,
};

const statusButtonStyles: Record<string, string> = {
  "draft:in_review": "bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white",
  "in_review:draft": "bg-gray-500 hover:bg-gray-500/90 text-white",
  "in_review:approved": "bg-[#10B981] hover:bg-[#10B981]/90 text-white",
  "approved:live": "bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white",
  "live:archived": "bg-gray-500 hover:bg-gray-500/90 text-white",
};

export function StatusActions({
  versionId,
  currentStatus,
  userRole,
}: StatusActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const availableTransitions = getAvailableTransitions(userRole, currentStatus);

  if (availableTransitions.length === 0) {
    return null;
  }

  async function handleStatusChange(targetStatus: VersionStatus) {
    setIsLoading(targetStatus);
    setError("");

    try {
      const response = await fetch(`/api/versions/${versionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change status");
        return;
      }

      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTransitions.map((targetStatus) => {
        const key = `${currentStatus}:${targetStatus}`;
        const label = getTransitionLabel(currentStatus, targetStatus);
        const icon = statusIcons[key];
        const style = statusButtonStyles[key] || "bg-gray-500 hover:bg-gray-500/90 text-white";

        return (
          <Button
            key={targetStatus}
            size="sm"
            className={style}
            onClick={() => handleStatusChange(targetStatus)}
            disabled={isLoading !== null}
          >
            {isLoading === targetStatus ? (
              "..."
            ) : (
              <>
                {icon}
                {label}
              </>
            )}
          </Button>
        );
      })}
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}
