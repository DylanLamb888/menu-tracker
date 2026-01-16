"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

type CommentCategory = "content" | "design" | "pricing" | "other";

interface User {
  id: string;
  name: string;
}

interface CommentInputProps {
  versionId: string;
  onCommentAdded?: () => void;
}

const categories: { value: CommentCategory; label: string }[] = [
  { value: "content", label: "Content" },
  { value: "design", label: "Design" },
  { value: "pricing", label: "Pricing" },
  { value: "other", label: "Other" },
];

export function CommentInput({ versionId, onCommentAdded }: CommentInputProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommentCategory>("other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Mention autocomplete state
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Fetch users for mentions
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(() => {});
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(value);

    // Check for @ trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space before @ (or it's at start) and no space after @
      const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : " ";
      if ((charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) && !textAfterAt.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
    setMentionSearch("");
    setMentionStartIndex(-1);
  }, []);

  const insertMention = useCallback((user: User) => {
    if (mentionStartIndex === -1) return;

    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(mentionStartIndex + mentionSearch.length + 1);
    const newContent = `${before}@${user.name} ${after}`;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch("");
    setMentionStartIndex(-1);

    // Focus textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + user.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, mentionStartIndex, mentionSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredUsers[selectedMentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  }, [showMentions, filteredUsers, selectedMentionIndex, insertMention]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/versions/${versionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add comment");
        return;
      }

      setContent("");
      setCategory("other");
      onCommentAdded?.();
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2 relative">
        <Label htmlFor="comment" className="text-sm text-[#3D2E2E]/70">
          Add a comment <span className="text-[#3D2E2E]/40">(type @ to mention)</span>
        </Label>
        <textarea
          ref={textareaRef}
          id="comment"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Write your comment..."
          rows={3}
          className="w-full rounded-md border border-[#3D2E2E]/20 bg-white px-3 py-2 text-sm text-[#3D2E2E] placeholder:text-[#3D2E2E]/40 focus:border-[#E07A5F] focus:outline-none focus:ring-1 focus:ring-[#E07A5F] resize-none"
        />

        {/* Mentions dropdown */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute z-10 mt-1 w-48 bg-white border border-[#3D2E2E]/10 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredUsers.slice(0, 5).map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === selectedMentionIndex
                    ? "bg-[#E07A5F]/10 text-[#E07A5F]"
                    : "text-[#3D2E2E] hover:bg-[#3D2E2E]/5"
                }`}
              >
                @{user.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-[#3D2E2E]/50">Category:</Label>
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  category === cat.value
                    ? "bg-[#E07A5F] text-white"
                    : "bg-[#3D2E2E]/5 text-[#3D2E2E]/70 hover:bg-[#3D2E2E]/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !content.trim()}
          className="bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white"
        >
          {isSubmitting ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Send
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
