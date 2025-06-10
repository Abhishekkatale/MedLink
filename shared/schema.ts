import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const UserRole = z.enum(['admin', 'superadmin', 'patient']);

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
  role: text("role", { enum: UserRole.options }).notNull().default('patient'),
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
  timeAgo: text("time_ago").notNull(),
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
  timeAgo: text("time_ago").notNull(),
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
  status: text("status").notNull(), // pending, accepted
  createdAt: timestamp("created_at").defaultNow(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  role: UserRole,
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
export const insertConnectionSchema = createInsertSchema(connections).omit({ id: true, createdAt: true });
export const insertStatSchema = createInsertSchema(stats).omit({ id: true });

// Select Schemas for precise type inference
export const selectUserSchema = createSelectSchema(users, {
  role: UserRole,
});

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
