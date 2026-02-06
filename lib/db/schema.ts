import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "designer",
  "approver",
  "reviewer",
  "contributor",
]);

export const versionStatusEnum = pgEnum("version_status", [
  "draft",
  "in_review",
  "approved",
  "live",
  "archived",
]);

export const commentCategoryEnum = pgEnum("comment_category", [
  "content",
  "design",
  "pricing",
  "other",
]);

export const activityActionEnum = pgEnum("activity_action", [
  "version_created",
  "status_changed",
  "comment_added",
  "pdf_downloaded",
  "pdf_viewed",
  "version_assigned",
  "user_logged_in",
  "annotation_added",
  "annotation_deleted",
]);

export const annotationToolEnum = pgEnum("annotation_tool", [
  "pen",
  "text",
  "checkmark",
  "highlight",
]);

export const activityTargetTypeEnum = pgEnum("activity_target_type", [
  "version",
  "menu",
  "user",
  "comment",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("contributor"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  colour: text("colour").notNull().default("#9CA3AF"),
});

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const menuTags = pgTable("menu_tags", {
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export const versions = pgTable("versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id, { onDelete: "cascade" }),
  parentVersionId: uuid("parent_version_id"),
  versionLabel: text("version_label").notNull(),
  status: versionStatusEnum("status").notNull().default("draft"),
  pdfUrl: text("pdf_url").notNull(),
  pdfFilename: text("pdf_filename").notNull(),
  reasonForChange: text("reason_for_change"),
  changeSummary: text("change_summary"),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  wentLiveAt: timestamp("went_live_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itemChanges = pgTable("item_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => versions.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => versions.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  category: commentCategoryEnum("category").notNull().default("other"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const commentMentions = pgTable("comment_mentions", {
  commentId: uuid("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const annotations = pgTable("annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => versions.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  tool: annotationToolEnum("tool").notNull(),
  color: text("color").notNull().default("#E07A5F"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  action: activityActionEnum("action").notNull(),
  targetType: activityTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Version = typeof versions.$inferSelect;
export type ItemChange = typeof itemChanges.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
