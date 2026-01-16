"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCircle, Check, X } from "lucide-react";

type UserRole = "admin" | "designer" | "approver" | "reviewer" | "contributor";

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AssignmentSelectorProps {
  versionId: string;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  userRole: UserRole;
}

export function AssignmentSelector({
  versionId,
  currentAssigneeId,
  currentAssigneeName,
  userRole,
}: AssignmentSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const canAssign = userRole === "admin";

  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUsers(data.users);
          }
        })
        .catch(() => setError("Failed to load users"));
    }
  }, [isOpen, users.length]);

  async function handleAssign(userId: string | null) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to assign");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (!canAssign) {
    // Read-only display
    return (
      <div className="flex items-center gap-2 text-sm">
        <UserCircle className="h-4 w-4 text-[#3D2E2E]/50" />
        <span className="text-[#3D2E2E]/70">Assigned to</span>
        <span className="text-[#3D2E2E] font-medium">
          {currentAssigneeName || "Unassigned"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 text-sm">
        <UserCircle className="h-4 w-4 text-[#3D2E2E]/50" />
        <span className="text-[#3D2E2E]/70">Assigned to</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-auto py-0.5 px-2 text-sm font-medium text-[#E07A5F] hover:text-[#E07A5F]/80 hover:bg-[#E07A5F]/10"
        >
          {currentAssigneeName || "Unassigned"}
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-[#3D2E2E]/10 rounded-lg shadow-lg min-w-[200px]">
          <div className="p-1">
            {currentAssigneeId && (
              <button
                onClick={() => handleAssign(null)}
                disabled={isLoading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded hover:bg-[#3D2E2E]/5 text-[#3D2E2E]/70"
              >
                <X className="h-4 w-4" />
                Unassign
              </button>
            )}
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleAssign(user.id)}
                disabled={isLoading || user.id === currentAssigneeId}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left rounded hover:bg-[#3D2E2E]/5 disabled:opacity-50"
              >
                <span className="text-[#3D2E2E]">{user.name}</span>
                {user.id === currentAssigneeId && (
                  <Check className="h-4 w-4 text-[#10B981]" />
                )}
              </button>
            ))}
          </div>
          {error && (
            <p className="px-3 py-2 text-xs text-red-600 border-t border-[#3D2E2E]/10">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
