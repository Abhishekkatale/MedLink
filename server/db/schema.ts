import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
// Adjust the import path for UserRole based on the new file location (server/db/schema.ts)
import { UserRole } from '../../shared/schema';

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Password will be hashed by application logic
  name: text("name").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  specialty: text("specialty").notNull(),
  location: text("location").notNull(),
  initials: text("initials").notNull(),
  isConnected: boolean("is_connected").default(false),
  // Use UserRole.options from the imported Zod enum for the text enum constraint
  role: text("role", { enum: UserRole.options }).notNull().default(UserRole.enum.Patient),
  profilePictureUrl: text("profile_picture_url"), // Added new field (nullable by default)
  education: text("education"), // For Students (nullable by default)
  medicalHistory: text("medical_history"), // For Patients (nullable by default)
});

// User profile schema
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  profileCompletion: integer("profile_completion").default(0),
  remainingItems: integer("remaining_items").default(0),
  networkGrowth: integer("network_growth").default(0),
  networkGrowthDays: integer("network_growth_days").default(30),
});

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Post schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: 'set null' }), // Allow category to be nullified
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event types schema
export const eventTypes = pgTable("event_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Event schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  time: text("time").notNull(),
  eventTypeId: integer("event_type_id").references(() => eventTypes.id, { onDelete: 'set null' }), // Allow event type to be nullified
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document sharing schema
// Using a composite primary key for uniqueness if a user can only be shared a document once
export const documentSharing = pgTable("document_sharing", {
  id: serial("id").primaryKey(), // Still useful for simple joins or ORM compatibility
  documentId: integer("document_id").references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Example of how to add a composite unique constraint if needed, though serial id is often simpler for ORM.
// Drizzle doesn't directly support composite PKs in the main table definition easily without indexes.
// For now, a serial `id` is fine.

// Post participants schema
export const postParticipants = pgTable("post_participants", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
});

// Saved posts schema
export const savedPosts = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
});

// Connections schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectedUserId: integer("connected_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text("status", { enum: ['pending', 'accepted', 'rejected'] }).notNull(), // Defined statuses
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Added updatedAt
});

// Stats schema (Simplified, as it was not fully defined in shared/schema)
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  value: integer("value").notNull(), // Changed from text to integer based on usage
  icon: text("icon").notNull(),
  iconColor: text("icon_color").notNull(),
  change: integer("change").notNull(), // Changed from text to integer
  timeframe: text("timeframe").notNull(),
});

// Define relations for users table (example)
import { relations } from 'drizzle-orm';

export const userRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  postsAuthored: many(posts, { relationName: 'authorToPosts' }), // Assuming posts.authorId relates to users.id
  documentsOwned: many(documents, { relationName: 'ownerToDocuments' }), // Assuming documents.ownerId relates to users.id
  likes: many(likes),
  comments: many(comments),
  connectionsInitiated: many(connections, { relationName: 'initiatedConnections' }),
  connectionsReceived: many(connections, { relationName: 'receivedConnections' }),
  // postParticipants: many(postParticipants), // if needed
  // savedPosts: many(savedPosts), // if needed
}));

// Likes schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    likesPostUserUniqueIdx: uniqueIndex("likes_post_user_unique_idx").on(table.postId, table.userId),
  };
});

export const likeRelations = relations(likes, ({ one }) => ({
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  user: one(users, { fields: [likes.userId], references: [users.id] }),
}));

// Comments schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id").references((): any => comments.id, { onDelete: 'cascade' }), // Self-referential
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parentComment: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'repliesTo',
  }),
  replies: many(comments, {
    relationName: 'repliesTo',
  }),
}));

export const postRelations = relations(posts, ({ one, many }) => ({
    author: one(users, { fields: [posts.authorId], references: [users.id], relationName: 'authorToPosts' }),
    category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
    likes: many(likes),
    comments: many(comments),
    postParticipants: many(postParticipants),
    savedPosts: many(savedPosts),
}));

export const postParticipantRelations = relations(postParticipants, ({ one }) => ({
  post: one(posts, { fields: [postParticipants.postId], references: [posts.id] }),
  user: one(users, { fields: [postParticipants.userId], references: [users.id] }),
}));

export const savedPostRelations = relations(savedPosts, ({ one }) => ({
  post: one(posts, { fields: [savedPosts.postId], references: [posts.id] }),
  user: one(users, { fields: [savedPosts.userId], references: [users.id] }),
}));

export const documentRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, { fields: [documents.ownerId], references: [users.id], relationName: 'ownerToDocuments' }),
  documentSharings: many(documentSharing),
}));

export const documentSharingRelations = relations(documentSharing, ({ one }) => ({
  document: one(documents, { fields: [documentSharing.documentId], references: [documents.id] }),
  user: one(users, { fields: [documentSharing.userId], references: [users.id] }),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  user: one(users, {fields: [connections.userId], references: [users.id], relationName: 'initiatedConnections'}),
  connectedUser: one(users, {fields: [connections.connectedUserId], references: [users.id], relationName: 'receivedConnections'}),
}));
