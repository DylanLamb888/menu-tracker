"use client";

import { useState, useEffect } from "react";
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
import { Plus, Pencil, KeyRound, UserCheck, UserX } from "lucide-react";

type UserRole = "admin" | "designer" | "approver" | "reviewer" | "contributor";

interface User {
  id: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  designer: "Designer",
  approver: "Approver",
  reviewer: "Reviewer",
  contributor: "Contributor",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  designer: "bg-blue-100 text-blue-700",
  approver: "bg-green-100 text-green-700",
  reviewer: "bg-amber-100 text-amber-700",
  contributor: "bg-gray-100 text-gray-700",
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("contributor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users?includeInactive=true");
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openAdd() {
    setFormName("");
    setFormPassword("");
    setFormRole("contributor");
    setError("");
    setIsAddOpen(true);
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setError("");
    setIsEditOpen(true);
  }

  function openReset(user: User) {
    setSelectedUser(user);
    setFormPassword("");
    setError("");
    setIsResetOpen(true);
  }

  async function handleAdd() {
    if (!formName.trim() || !formPassword.trim()) {
      setError("Name and password are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          password: formPassword,
          role: formRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create user");
        return;
      }

      setIsAddOpen(false);
      fetchUsers();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!selectedUser || !formName.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          role: formRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update user");
        return;
      }

      setIsEditOpen(false);
      fetchUsers();
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || !formPassword.trim()) {
      setError("Password is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setIsResetOpen(false);
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(user: User) {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update user status");
        return;
      }

      fetchUsers();
    } catch {
      alert("An error occurred");
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-[#3D2E2E]/70">Loading users...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-[#3D2E2E]">User Management</h3>
        <Button
          onClick={openAdd}
          className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <Card
            key={user.id}
            className={`border-[#3D2E2E]/10 ${!user.isActive ? "opacity-60" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#3D2E2E]">
                        {user.name}
                      </span>
                      {!user.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role]}`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(user)}
                    className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReset(user)}
                    className="text-[#3D2E2E]/70 hover:text-[#3D2E2E]"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(user)}
                    className={
                      user.isActive
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50"
                    }
                  >
                    {user.isActive ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The password will be used for login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <select
                id="add-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-[#3D2E2E]/20 bg-transparent px-3 py-1 text-sm focus:border-[#E07A5F] focus:outline-none"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user name and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-[#3D2E2E]/20 bg-transparent px-3 py-1 text-sm focus:border-[#E07A5F] focus:outline-none"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isSubmitting}
              className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
