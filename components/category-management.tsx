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
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openAdd() {
    setFormName("");
    setError("");
    setIsAddOpen(true);
  }

  function openEdit(category: Category) {
    setSelectedCategory(category);
    setFormName(category.name);
    setError("");
    setIsEditOpen(true);
  }

  async function handleAdd() {
    if (!formName.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create category");
        return;
      }

      setIsAddOpen(false);
      fetchCategories();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selectedCategory || !formName.trim()) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update category");
        return;
      }

      setIsEditOpen(false);
      fetchCategories();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete category");
        return;
      }

      fetchCategories();
    } catch {
      alert("An error occurred");
    }
  }

  function handleDragStart(e: React.DragEvent, categoryId: string) {
    setDraggedId(categoryId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = categories.findIndex((c) => c.id === draggedId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally
    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedItem);
    setCategories(newCategories);
    setDraggedId(null);

    // Save to server
    try {
      const response = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newCategories.map((c) => c.id) }),
      });

      if (!response.ok) {
        // Revert on failure
        fetchCategories();
      }
    } catch {
      fetchCategories();
    }
  }

  function handleDragEnd() {
    setDraggedId(null);
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-[#3D2E2E]/70">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#3D2E2E]">
          Category Management
        </h3>
        <Button
          onClick={openAdd}
          className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <p className="text-sm text-[#3D2E2E]/70">
        Drag categories to reorder them.
      </p>

      <div className="space-y-2">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={`border-[#3D2E2E]/10 cursor-move transition-opacity ${
              draggedId === category.id ? "opacity-50" : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, category.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category.id)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-[#3D2E2E]/30" />
                  <span className="font-medium text-[#3D2E2E]">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(category)}
                    className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-8 text-[#3D2E2E]/70">
            No categories yet. Add one to get started.
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new menu category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-category-name">Name</Label>
              <Input
                id="add-category-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter category name"
                autoFocus
              />
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
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter category name"
              />
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
