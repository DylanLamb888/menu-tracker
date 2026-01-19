"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  colour: string;
}

const presetColors = [
  "#E07A5F", // Coral (brand)
  "#9CA3AF", // Gray
  "#10B981", // Green
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
];

export function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [error, setError] = useState("");
  const [formName, setFormName] = useState("");
  const [formColour, setFormColour] = useState("#9CA3AF");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      if (response.ok) {
        setTags(data.tags);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  function openAdd() {
    setFormName("");
    setFormColour("#9CA3AF");
    setError("");
    setIsAddOpen(true);
  }

  function openEdit(tag: Tag) {
    setSelectedTag(tag);
    setFormName(tag.name);
    setFormColour(tag.colour);
    setError("");
    setIsEditOpen(true);
  }

  async function handleAdd() {
    if (!formName.trim()) {
      setError("Tag name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), colour: formColour }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create tag");
        return;
      }

      setIsAddOpen(false);
      fetchTags();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selectedTag || !formName.trim()) {
      setError("Tag name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), colour: formColour }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update tag");
        return;
      }

      setIsEditOpen(false);
      fetchTags();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete tag");
        return;
      }

      fetchTags();
    } catch {
      alert("An error occurred");
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-[#3D2E2E]/70">Loading tags...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#3D2E2E]">Tag Management</h3>
        <Button
          onClick={openAdd}
          className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => (
          <Card key={tag.id} className="border-[#3D2E2E]/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-[#3D2E2E]/10"
                    style={{ backgroundColor: tag.colour }}
                  />
                  <span className="font-medium text-[#3D2E2E]">{tag.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(tag)}
                    className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tags.length === 0 && (
          <div className="text-center py-8 text-[#3D2E2E]/70">
            No tags yet. Add one to get started.
          </div>
        )}
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag with a name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-tag-name">Name</Label>
              <Input
                id="add-tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter tag name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColour(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formColour === color
                          ? "border-[#3D2E2E] scale-110"
                          : "border-transparent hover:border-[#3D2E2E]/30"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formColour}
                  onChange={(e) => setFormColour(e.target.value)}
                  className="w-12 h-8 p-0 border-none cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update the tag name and color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Name</Label>
              <Input
                id="edit-tag-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColour(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formColour === color
                          ? "border-[#3D2E2E] scale-110"
                          : "border-transparent hover:border-[#3D2E2E]/30"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formColour}
                  onChange={(e) => setFormColour(e.target.value)}
                  className="w-12 h-8 p-0 border-none cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
