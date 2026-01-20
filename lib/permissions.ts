type UserRole = "admin" | "designer" | "approver" | "reviewer" | "contributor";
type VersionStatus = "draft" | "in_review" | "approved" | "live" | "archived";

interface StatusTransition {
  from: VersionStatus;
  to: VersionStatus;
  allowedRoles: UserRole[];
}

// Define all allowed status transitions and which roles can perform them
const statusTransitions: StatusTransition[] = [
  { from: "draft", to: "in_review", allowedRoles: ["admin"] },
  { from: "in_review", to: "draft", allowedRoles: ["admin"] }, // Rejection
  { from: "in_review", to: "approved", allowedRoles: ["admin", "approver"] },
  { from: "approved", to: "live", allowedRoles: ["admin"] },
  { from: "live", to: "archived", allowedRoles: ["admin"] }, // Manual archive
];

export function canChangeStatus(
  userRole: UserRole,
  currentStatus: VersionStatus,
  targetStatus: VersionStatus
): boolean {
  const transition = statusTransitions.find(
    (t) => t.from === currentStatus && t.to === targetStatus
  );

  if (!transition) {
    return false;
  }

  return transition.allowedRoles.includes(userRole);
}

export function getAvailableTransitions(
  userRole: UserRole,
  currentStatus: VersionStatus
): VersionStatus[] {
  return statusTransitions
    .filter(
      (t) =>
        t.from === currentStatus && t.allowedRoles.includes(userRole)
    )
    .map((t) => t.to);
}

export function getStatusLabel(status: VersionStatus): string {
  const labels: Record<VersionStatus, string> = {
    draft: "Draft",
    in_review: "In Review",
    approved: "Approved",
    live: "Live",
    archived: "Archived",
  };
  return labels[status];
}

export function getTransitionLabel(
  from: VersionStatus,
  to: VersionStatus
): string {
  const labels: Record<string, string> = {
    "draft:in_review": "Submit for Review",
    "in_review:draft": "Reject",
    "in_review:approved": "Approve",
    "approved:live": "Go Live",
    "live:archived": "Archive",
  };
  return labels[`${from}:${to}`] || `Change to ${getStatusLabel(to)}`;
}

export function canAnnotate(userRole: UserRole): boolean {
  return ["admin", "designer", "approver"].includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}
