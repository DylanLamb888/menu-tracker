import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { FileText } from "lucide-react";

interface MenuCardProps {
  id: string;
  name: string;
  category: string | null;
  currentStatus: "draft" | "in_review" | "approved" | "live" | "archived" | null;
  updatedAt: Date;
}

export function MenuCard({ id, name, category, currentStatus, updatedAt }: MenuCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(updatedAt));

  return (
    <Link href={`/menus/${id}`}>
      <Card className="h-full hover:shadow-md cursor-pointer border-[#3D2E2E]/10">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#E07A5F]" />
              <CardTitle className="text-lg font-semibold text-[#3D2E2E]">
                {name}
              </CardTitle>
            </div>
            {currentStatus && <StatusBadge status={currentStatus} />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-sm text-[#3D2E2E]/70">
            {category && <p>{category}</p>}
            <p>Updated {formattedDate}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
