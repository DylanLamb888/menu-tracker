import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-[#9CA3AF] hover:bg-[#9CA3AF]/80 text-white",
  },
  in_review: {
    label: "In Review",
    className: "bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-white",
  },
  approved: {
    label: "Approved",
    className: "bg-[#10B981] hover:bg-[#10B981]/80 text-white",
  },
  live: {
    label: "Live",
    className: "bg-[#E07A5F] hover:bg-[#E07A5F]/80 text-white",
  },
  archived: {
    label: "Archived",
    className: "bg-[#6B7280] hover:bg-[#6B7280]/80 text-white",
  },
} as const;

type VersionStatus = keyof typeof statusConfig;

interface StatusBadgeProps {
  status: VersionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
