import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const UserRole = z.enum(['Doctor', 'Student', 'Patient']);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  specialty: text("specialty").notNull(),
  location: text("location").notNull(),
  initials: text("initials").notNull(),
  isConnected: boolean("is_connected").default(false),
  role: text("role", { enum: UserRole.options }).notNull().default(UserRole.enum.Patient), // Corrected default
  profilePictureUrl: text("profile_picture_url"), // Added new field (nullable by default)
  education: text("education"), // For Students (nullable by default)
  medicalHistory: text("medical_history"), // For Patients (nullable by default)
});

// User profile schema
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  profileCompletion: integer("profile_completion").default(0),
  remainingItems: integer("remaining_items").default(0),
  networkGrowth: integer("network_growth").default(0),
  networkGrowthDays: integer("network_growth_days").default(30),
});

// Post schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  time: text("time").notNull(),
  eventTypeId: integer("event_type_id").references(() => eventTypes.id).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Event types schema
export const eventTypes = pgTable("event_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Document sharing schema
export const documentSharing = pgTable("document_sharing", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post participants schema
export const postParticipants = pgTable("post_participants", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Saved posts schema
export const savedPosts = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

// Connections schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  connectedUserId: integer("connected_user_id").references(() => users.id).notNull(),
  status: text("status", { enum: ['pending', 'accepted', 'rejected'] }).notNull(), // Defined statuses
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Added updatedAt
});

// Stats schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  value: integer("value").notNull(),
  icon: text("icon").notNull(),
  iconColor: text("icon_color").notNull(),
  change: integer("change").notNull(),
  timeframe: text("timeframe").notNull(),
});

// Likes schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id").references((): any => comments.id, { onDelete: 'cascade' }), // Self-referential for threaded comments
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
// Re-create insertUserSchema to include the new field by default from pgTable
export const insertUserSchema = createInsertSchema(users, {
  role: UserRole, // Keep custom Zod type for role if needed for specific validation
  // profilePictureUrl will be inferred as optional string | null from the table definition
  // education and medicalHistory will also be inferred
}).omit({ id: true });

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertEventTypeSchema = createInsertSchema(eventTypes).omit({ id: true });
export const insertDocumentSharingSchema = createInsertSchema(documentSharing).omit({ id: true, createdAt: true });
export const insertPostParticipantSchema = createInsertSchema(postParticipants).omit({ id: true });
export const insertSavedPostSchema = createInsertSchema(savedPosts).omit({ id: true });
// Update insertConnectionSchema to reflect changes (if any from .defaultNow() or .notNull() implicitly)
// For now, only `updatedAt` is new and handled by default.
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true });
export const insertStatSchema = createInsertSchema(stats).omit({ id: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true });

// Schema for creating a new comment (for API validation)
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty."),
  parentId: z.number().int().positive().optional().nullable(), // Optional for top-level comments
});

// Schema for updating user profile information
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").optional(),
  title: z.string().optional(),
  organization: z.string().optional(),
  specialty: z.string().optional(),
  location: z.string().optional(),
  initials: z.string().max(4, "Initials can be max 4 characters.").optional(), // Assuming a max length for initials
  isConnected: z.boolean().optional(), // Note: 'isConnected' on users table might be deprecated in favor of 'connections' table.
  profilePictureUrl: z.string().url("Must be a valid URL.").optional().nullable(),
  education: z.string().optional().nullable(), // Added for Students
  medicalHistory: z.string().optional().nullable(), // Added for Patients
});

// Select Schemas for precise type inference
// Re-create selectUserSchema to include the new field
export const selectUserSchema = createSelectSchema(users, {
  role: UserRole, // Keep custom Zod type for role
  // profilePictureUrl will be inferred
});
export const selectLikeSchema = createSelectSchema(likes);
export const selectCommentSchema = createSelectSchema(comments);


// Types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventType = typeof eventTypes.$inferSelect;
export type InsertEventType = z.infer<typeof insertEventTypeSchema>;

export type DocumentSharing = typeof documentSharing.$inferSelect;
export type InsertDocumentSharing = z.infer<typeof insertDocumentSharingSchema>;

export type PostParticipant = typeof postParticipants.$inferSelect;
export type InsertPostParticipant = z.infer<typeof insertPostParticipantSchema>;

export type SavedPost = typeof savedPosts.$inferSelect;
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Stat = typeof stats.$inferSelect;
export type InsertStat = z.infer<typeof insertStatSchema>;

export type Like = z.infer<typeof selectLikeSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Comment = z.infer<typeof selectCommentSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
