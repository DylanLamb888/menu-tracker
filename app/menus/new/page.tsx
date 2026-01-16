"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function NewMenuPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch {
        // Categories are optional, continue without them
      }
    }
    fetchCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Menu name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId: categoryId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create menu");
        return;
      }

      router.push(`/menus/${data.menu.id}`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="max-w-lg border-[#3D2E2E]/10">
          <CardHeader>
            <CardTitle className="text-xl text-[#3D2E2E]">
              Create New Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#3D2E2E]">
                  Menu Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., À La Carte Menu"
                  required
                  autoFocus
                  className="border-[#3D2E2E]/20 focus:border-[#E07A5F] focus:ring-[#E07A5F]"
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[#3D2E2E]">
                    Category
                  </Label>
                  <select
                    id="category"
                    name="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 rounded-md border border-[#3D2E2E]/20 bg-transparent px-3 py-1 text-sm focus:border-[#E07A5F] focus:ring-[#E07A5F] focus:outline-none"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
                >
                  {isSubmitting ? "Creating..." : "Create Menu"}
                </Button>
                <Link href="/">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#3D2E2E]/20 text-[#3D2E2E]"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
