import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { FileText, AlertCircle } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  colour: string;
}

interface MenuCardProps {
  id: string;
  name: string;
  category: string | null;
  currentStatus: "draft" | "in_review" | "approved" | "live" | "archived" | null;
  updatedAt: Date;
  needsAttention?: boolean;
  tags?: Tag[];
}

export function MenuCard({ id, name, category, currentStatus, updatedAt, needsAttention, tags }: MenuCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(updatedAt));

  return (
    <Link href={`/menus/${id}`}>
      <Card className={`h-full hover:shadow-md cursor-pointer border-[#3D2E2E]/10 ${needsAttention ? "ring-2 ring-[#E07A5F]/50" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#E07A5F]" />
              <CardTitle className="text-lg font-semibold text-[#3D2E2E]">
                {name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {needsAttention && (
                <Badge variant="outline" className="border-[#E07A5F] text-[#E07A5F] bg-[#E07A5F]/5">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Your turn
                </Badge>
              )}
              {currentStatus && <StatusBadge status={currentStatus} />}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-[#3D2E2E]/70">
            {category && <p>{category}</p>}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: tag.colour + "20",
                      color: tag.colour,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: tag.colour }}
                    />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <p>Updated {formattedDate}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
