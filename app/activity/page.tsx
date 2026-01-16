"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  FileText,
  MessageSquare,
  UserCheck,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";

type ActionType =
  | "version_created"
  | "status_changed"
  | "comment_added"
  | "pdf_downloaded"
  | "pdf_viewed"
  | "version_assigned"
  | "user_logged_in";

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: ActionType;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  versionLabel: string | null;
  menuId: string | null;
  menuName: string | null;
}

const actionLabels: Record<ActionType, string> = {
  version_created: "Created version",
  status_changed: "Changed status",
  comment_added: "Added comment",
  pdf_downloaded: "Downloaded PDF",
  pdf_viewed: "Viewed PDF",
  version_assigned: "Assigned version",
  user_logged_in: "Logged in",
};

const actionIcons: Record<ActionType, React.ReactNode> = {
  version_created: <FileText className="h-4 w-4" />,
  status_changed: <RefreshCw className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  pdf_downloaded: <FileText className="h-4 w-4" />,
  pdf_viewed: <FileText className="h-4 w-4" />,
  version_assigned: <UserCheck className="h-4 w-4" />,
  user_logged_in: <Activity className="h-4 w-4" />,
};

const actionColors: Record<ActionType, string> = {
  version_created: "bg-emerald-100 text-emerald-700",
  status_changed: "bg-amber-100 text-amber-700",
  comment_added: "bg-blue-100 text-blue-700",
  pdf_downloaded: "bg-gray-100 text-gray-700",
  pdf_viewed: "bg-gray-100 text-gray-700",
  version_assigned: "bg-purple-100 text-purple-700",
  user_logged_in: "bg-gray-100 text-gray-700",
};

const filterOptions: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "version_created", label: "Version created" },
  { value: "status_changed", label: "Status changed" },
  { value: "comment_added", label: "Comments" },
  { value: "version_assigned", label: "Assignments" },
];

// Hoist DateTimeFormat outside component to avoid recreation
const activityDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const url = filter
          ? `/api/activity?action=${filter}`
          : "/api/activity";
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          setActivities(data.activities);
        }
      } catch {
        // Handle error silently
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [filter]);

  function getActivityDescription(log: ActivityLog): React.ReactNode {
    const metadata = log.metadata as Record<string, unknown> | null;

    switch (log.action) {
      case "status_changed":
        return (
          <>
            changed status from{" "}
            <span className="font-medium">{String(metadata?.previousStatus || "?")}</span> to{" "}
            <span className="font-medium">{String(metadata?.newStatus || "?")}</span>
          </>
        );
      case "version_assigned":
        return (
          <>
            assigned version to{" "}
            <span className="font-medium">
              {metadata?.newAssignee ? "a user" : "unassigned"}
            </span>
          </>
        );
      case "comment_added":
        return (
          <>
            added a{" "}
            <span className="font-medium">{String(metadata?.category || "other")}</span>{" "}
            comment
          </>
        );
      default:
        return actionLabels[log.action]?.toLowerCase();
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#3D2E2E]">Activity</h2>
            <p className="text-sm text-[#3D2E2E]/70 mt-1">
              Recent actions across all menus
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              onClick={() => setFilter(option.value)}
              className={`${
                filter === option.value
                  ? "bg-[#E07A5F] text-white border-[#E07A5F] hover:bg-[#E07A5F]/90"
                  : "border-[#3D2E2E]/20 text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Activity List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E07A5F] border-t-transparent" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-[#3D2E2E]/5 p-4 mb-4">
              <Clock className="h-8 w-8 text-[#3D2E2E]/30" />
            </div>
            <h3 className="text-lg font-medium text-[#3D2E2E]">No activity yet</h3>
            <p className="text-sm text-[#3D2E2E]/70 mt-1">
              Activity will appear here as you use the app
            </p>
          </div>
        ) : (
          <Card className="border-[#3D2E2E]/10">
            <CardContent className="p-0">
              <div className="divide-y divide-[#3D2E2E]/10">
                {activities.map((log) => {
                  const formattedDate = activityDateFormatter.format(new Date(log.createdAt));

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 hover:bg-[#3D2E2E]/5 transition-colors"
                    >
                      <div
                        className={`rounded-full p-2 ${actionColors[log.action]}`}
                      >
                        {actionIcons[log.action]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#3D2E2E]">
                          <span className="font-medium">{log.userName}</span>{" "}
                          {getActivityDescription(log)}
                        </p>
                        {log.versionLabel && log.menuId && (
                          <Link
                            href={`/menus/${log.menuId}/versions/${log.targetId}`}
                            className="flex items-center gap-1 mt-1 text-xs text-[#E07A5F] hover:underline"
                          >
                            {log.menuName}{" "}
                            <ArrowRight className="h-3 w-3" />{" "}
                            <span className="font-mono">{log.versionLabel}</span>
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-[#3D2E2E]/50 whitespace-nowrap">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
