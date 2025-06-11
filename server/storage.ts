import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg'; // Changed import
const { Pool } = pg; // Compatibility for named import style if pg is a CJS module default export
import { eq, and, or, like, desc, sql, InferSelectModel, InferInsertModel, asc } from 'drizzle-orm'; // Added asc
import * as bcrypt from 'bcrypt';

// Import Drizzle schema
import * as schema from './db/schema'; // Adjusted path
import { UserRole } from '@shared/schema'; // For UserRole enum values

// Import types from shared/schema.ts for IStorage interface adherence
// These types are Zod-based. Drizzle can infer its own types, but IStorage uses these.
import type {
  User, InsertUser,
  Profile, InsertProfile,
  Post, InsertPost,
  Category, InsertCategory,
  Document, InsertDocument,
  Event, InsertEvent,
  EventType, InsertEventType,
  DocumentSharing, InsertDocumentSharing,
  PostParticipant, InsertPostParticipant,
  SavedPost, InsertSavedPost,
  Connection, InsertConnection,
  Stat, InsertStat,
  Like, InsertLike, // Added Like types
  Comment, InsertComment // Added Comment types
} from "@shared/schema";

// Define IStorage interface (copied from original, ensure it's identical)
export interface IStorage {
  getUsers(): Promise<User[]>;
  getUsersBySpecialty(specialty: string): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<Omit<User, 'id' | 'username' | 'password' | 'role'>>): Promise<User | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  // getCurrentUser() removed, use getUser(id) instead from route context
  getUserColleagues(userId: number): Promise<User[]>;
  getUserSuggestions(userId: number): Promise<User[]>;
  getConnectionRequests(userId: number): Promise<User[]>;
  createConnection(userId: number, connectedUserId: number): Promise<Connection>;
  getProfile(userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: number, profile: Partial<Profile>): Promise<Profile | undefined>;
  getPosts(currentUserId: number | undefined, filter?: string, searchTerm?: string, categoryId?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: Omit<InsertPost, 'authorId'>, authorId: number): Promise<Post>; // authorId now explicit
  savePost(currentUserId: number, postId: number, isSaved: boolean): Promise<void>; // userId renamed to currentUserId for clarity
  getPostParticipants(postId: number): Promise<User[]>;
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getDocuments(currentUserId: number | undefined, filter?: string, searchTerm?: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: Omit<InsertDocument, 'ownerId'>, ownerId: number): Promise<Document>; // ownerId now explicit
  shareDocument(documentId: number, userIds: number[]): Promise<void>;
  getDocumentSharedUsers(documentId: number): Promise<User[]>;
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEventTypes(): Promise<EventType[]>;
  getEventType(id: number): Promise<EventType | undefined>;
  createEventType(eventType: InsertEventType): Promise<EventType>;
  getSpecialties(): Promise<string[]>;
  getStats(userId: number): Promise<Stat[]>;
  createStat(stat: InsertStat): Promise<Stat>;
  seedDatabase(): Promise<void>; // Added for seeding

  // Connection lifecycle methods
  getConnectionById(connectionId: number): Promise<Connection | undefined>;
  updateConnectionStatus(connectionId: number, status: typeof schema.connections.status.enumValues[number]): Promise<Connection | undefined>;
  getConnectionsForUser(userId: number, status?: typeof schema.connections.status.enumValues[number]): Promise<Connection[]>;
  getMutualConnections(userId1: number, userId2: number): Promise<User[]>;

  // Likes and Comments methods
  createLike(postId: number, userId: number): Promise<Like | { error?: string; alreadyExists?: boolean }>;
  deleteLike(postId: number, userId: number): Promise<{ success: boolean }>;
  getLikesForPost(postId: number): Promise<Like[]>; // Consider returning User[] or count for efficiency
  createComment(postId: number, userId: number, content: string, parentId?: number): Promise<Comment>;
  getCommentsForPost(postId: number): Promise<Comment[]>;
  getCommentById(commentId: number): Promise<Comment | undefined>;
}


export class DrizzleStorage implements IStorage {
  private db: NodePgDatabase<typeof schema>;
  private pool: pg.Pool; // Changed type to pg.Pool
  // private currentUserIdForDemo: number = 1; // Removed

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    // If 'pg' default export has Pool as a property:
    // this.pool = new pg.Pool({ connectionString: databaseUrl });
    // If Pool was deconstructured from default (like const { Pool } = pg;):
    this.pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool, { schema });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    // The return type User is from Zod. Drizzle's select will infer a similar structure.
    // We might need to cast or ensure compatibility if structures diverge.
    return this.db.query.users.findMany() as Promise<User[]>;
  }

  async getUsersBySpecialty(specialty: string): Promise<User[]> {
    return this.db.query.users.findMany({
      where: eq(schema.users.specialty, specialty),
    }) as Promise<User[]>;
  }

  // Likes and Comments methods implementations
  async createLike(postId: number, userId: number): Promise<Like | { error?: string; alreadyExists?: boolean }> {
    try {
      const result = await this.db.insert(schema.likes)
        .values({ postId, userId })
        .returning();
      return result[0] as Like;
    } catch (error: any) {
      // Check for unique constraint violation (specific error code depends on DB, e.g., '23505' for PostgreSQL)
      if (error.code === '23505') { // PostgreSQL unique violation
        return { error: "User has already liked this post.", alreadyExists: true };
      }
      console.error("Error creating like:", error);
      return { error: "Failed to create like." };
    }
  }

  async deleteLike(postId: number, userId: number): Promise<{ success: boolean }> {
    const result = await this.db.delete(schema.likes)
      .where(and(eq(schema.likes.postId, postId), eq(schema.likes.userId, userId)))
      .returning(); // .returning({ id: schema.likes.id }); in newer Drizzle to check if something was deleted
    return { success: result.length > 0 };
  }

  async getLikesForPost(postId: number): Promise<Like[]> {
    return this.db.query.likes.findMany({
      where: eq(schema.likes.postId, postId),
      with: { // Optionally include user details if Like type expects it
        user: true
      }
    }) as Promise<Like[]>;
  }

  async createComment(postId: number, userId: number, content: string, parentId?: number): Promise<Comment> {
    const commentPayload: InsertComment = { postId, userId, content };
    if (parentId !== undefined) {
      commentPayload.parentId = parentId;
    }
    const result = await this.db.insert(schema.comments)
      .values(commentPayload)
      .returning();
    return result[0] as Comment;
  }

  async getCommentsForPost(postId: number): Promise<Comment[]> {
    // Fetch comments, order by creation date for basic chronological display
    // For threaded display, frontend might need to reconstruct hierarchy from parentId
    return this.db.query.comments.findMany({
      where: eq(schema.comments.postId, postId),
      orderBy: [asc(schema.comments.createdAt)], // asc for chronological
      with: { // Optionally include user details if Comment type expects it
        user: true,
        // replies: true, // If you set up a 'replies' relation in your Drizzle schema for comments
      }
    }) as Promise<Comment[]>;
  }
  
  async getCommentById(commentId: number): Promise<Comment | undefined> {
    return this.db.query.comments.findFirst({
        where: eq(schema.comments.id, commentId),
        with: { user: true }
    }) as Promise<Comment | undefined>;
  }
  async getUser(id: number): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    }) as Promise<User | undefined>;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(schema.users.username, username),
    }) as Promise<User | undefined>;
  }

  async updateUser(userId: number, updates: Partial<Omit<User, 'id' | 'username' | 'password' | 'role'>>): Promise<User | undefined> {
    if (Object.keys(updates).length === 0) {
      return this.getUser(userId); // No updates, just return the user
    }
    const result = await this.db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId))
      .returning();
    return result[0] as User | undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    // InsertUser is Zod-based. Drizzle's insert type is InferInsertModel.
    // Ensure all fields in 'user' (an InsertUser) match what 'schema.users' expects.
    const newUserPayload = {
      ...user,
      password: hashedPassword,
      // role needs to be one of UserRole.options
      role: user.role as typeof schema.users.role.enumValues[number],
    };

    try {
      const result = await this.db.insert(schema.users).values(newUserPayload).returning();
      return result[0] as User;
    } catch (error: any) {
      console.error("Error in createUser:", error, "Input user:", user);
      if (error.code === '23505' && error.constraint === 'users_username_unique') { // Specific to PostgreSQL for unique constraint
        // Consider throwing a custom error or a more specific error message
        console.error("Username already exists:", user.username);
      }
      throw error; // Re-throw the original error
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // getCurrentUser() removed from IStorage and DrizzleStorage.
  // Routes will use getUser(id) with id from authenticated req.user.

  async getUserColleagues(userId: number): Promise<User[]> {
    // This logic is simplified based on MemStorage (isConnected flag).
    // A real app would have a proper connections table and join.
    // The current schema has 'connections' table, so we should use that.
    const userConnections = await this.db.query.connections.findMany({
        where: and(
            eq(schema.connections.userId, userId),
            eq(schema.connections.status, 'accepted') // Assuming 'accepted' status means colleague
        ),
        with: {
            connectedUser: true // Load the related user
        }
    });
    const colleagues = userConnections.map(conn => conn.connectedUser);

    // Also consider connections where the current user is the connectedUserId
     const inverseUserConnections = await this.db.query.connections.findMany({
        where: and(
            eq(schema.connections.connectedUserId, userId),
            eq(schema.connections.status, 'accepted')
        ),
        with: {
            user: true // Load the related user
        }
    });
    colleagues.push(...inverseUserConnections.map(conn => conn.user));

    // Filter out duplicates if any and the user itself (though current logic shouldn't add user itself)
    const uniqueColleagues = Array.from(new Set(colleagues.map(c => c.id)))
      .map(id => colleagues.find(c => c.id === id)!)
      .filter(c => c.id !== userId);

    return uniqueColleagues as User[];
  }

  async getUserSuggestions(userId: number): Promise<User[]> {
    // Get IDs of users already connected or requested to exclude them
    const existingConnections = await this.db.query.connections.findMany({
        where: or(
            eq(schema.connections.userId, userId),
            eq(schema.connections.connectedUserId, userId)
        )
    });
    const connectedUserIds = new Set(existingConnections.flatMap(c => [c.userId, c.connectedUserId]));
    connectedUserIds.add(userId); // Exclude self

    const allUsers = await this.db.query.users.findMany();
    const suggestions = allUsers.filter(u => !connectedUserIds.has(u.id));
    return suggestions as User[];
  }

  async getConnectionRequests(userId: number): Promise<User[]> {
    const requests = await this.db.query.connections.findMany({
      where: and(
        eq(schema.connections.connectedUserId, userId),
        eq(schema.connections.status, "pending")
      ),
      with: {
        user: true, // The user who sent the request
      }
    });
    return requests.map(r => r.user) as User[];
  }

  async createConnection(userId: number, connectedUserId: number): Promise<Connection> {
    // Ensure types match Drizzle's expected insert type.
    // Connection is Zod-based.
    const newConnectionPayload = {
      userId,
      connectedUserId,
      status: "pending", // Default status
      // createdAt is defaultNow() in schema
    };
    try {
      const result = await this.db.insert(schema.connections).values(newConnectionPayload).returning();
      return result[0] as Connection;
    } catch (error: any) {
      console.error("Error in createConnection:", error, "Payload:", newConnectionPayload);
      if (error.code === '23503') { // Foreign key violation
        console.error("Foreign key violation in createConnection. Ensure userId and connectedUserId exist.");
      } else if (error.code === '23505') { // Unique constraint violation (if any)
        console.error("Unique constraint violation in createConnection.");
      }
      throw error; // Re-throw the original error
    }
  }

  // Profile methods
  async getProfile(userId: number): Promise<Profile | undefined> {
    return this.db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, userId),
    }) as Promise<Profile | undefined>;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await this.db.insert(schema.profiles).values(profile).returning();
    return result[0] as Profile;
  }

  async updateProfile(userId: number, profileUpdates: Partial<Profile>): Promise<Profile | undefined> {
    // Drizzle's update doesn't directly return the updated object by default in all scenarios.
    // We might need to fetch it again if `returning()` isn't sufficient or behaves differently.
    const currentProfile = await this.getProfile(userId);
    if (!currentProfile) return undefined;

    // Drizzle expects all fields for .returning() to be from the base table usually
    // For partial updates, ensure that `id` is not in `profileUpdates` if it's part of Zod schema but not PK
    const { id, ...updatesToApply } = profileUpdates; // Assuming 'id' in Profile is PK, userId is FK.

    const result = await this.db.update(schema.profiles)
      .set(updatesToApply)
      .where(eq(schema.profiles.userId, userId))
      .returning();
    return result[0] as Profile | undefined;
  }

  // This is a partial implementation to fit within reasonable limits for a single step.
  // The remaining methods would follow similar patterns.

  async getPosts(currentUserId: number | undefined, filter?: string, searchTerm?: string, categoryId?: string): Promise<any[]> { // Changed return type
    const conditions = [];
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(schema.posts.categoryId, parseInt(categoryId)));
    }
    if (searchTerm) {
      const term = `%${searchTerm.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${schema.posts.title})`, term),
          like(sql`lower(${schema.posts.content})`, term)
        )
      );
    }

    let postQuery = this.db.query.posts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        author: true,
        category: true,
        // postParticipants will be fetched later in bulk for all posts
        // savedPosts will be fetched later for the current user if provided
      },
      orderBy: [desc(schema.posts.createdAt)],
    });

    let fetchedPosts = await postQuery;

    // Handle "saved" filter specifically
    if (filter === "saved") {
      if (!currentUserId) return []; // Cannot get saved posts without user context
      const savedPostEntries = await this.db.query.savedPosts.findMany({
        where: eq(schema.savedPosts.userId, currentUserId),
        columns: { postId: true }
      });
      const savedPostIds = new Set(savedPostEntries.map(sp => sp.postId));
      if (savedPostIds.size === 0) return [];

      // Filter the already fetched posts by savedPostIds
      // Or, if performance is critical and many posts, re-fetch with IDs:
      // conditions.push(sql`${schema.posts.id} in ${Array.from(savedPostIds)}`);
      // postQuery = this.db.query.posts.findMany({ where: and(...conditions), with: { author: true, category: true }, orderBy: [desc(schema.posts.createdAt)] });
      // fetchedPosts = await postQuery;
      fetchedPosts = fetchedPosts.filter(p => savedPostIds.has(p.id));
    }

    if (fetchedPosts.length === 0) return [];

    const postIds = fetchedPosts.map(p => p.id);

    // Fetch postParticipants for all posts
    const allParticipantsEntries = await this.db.query.postParticipants.findMany({
      where: sql`${schema.postParticipants.postId} IN ${postIds}`,
      with: {
        user: {
          columns: { // Select only necessary user fields for participants
            id: true,
            initials: true,
            specialty: true,
            // Add other fields if needed by getColorClass or frontend
          }
        }
      }
    });

    const participantsByPostId = new Map<number, User[]>();
    allParticipantsEntries.forEach(ppe => {
      if (!participantsByPostId.has(ppe.postId)) {
        participantsByPostId.set(ppe.postId, []);
      }
      // Ensure ppe.user is not null and is of type User
      if (ppe.user) {
        participantsByPostId.get(ppe.postId)!.push(ppe.user as User);
      }
    });

    // Determine saved status for all posts if currentUserId is available
    let savedPostIdsForUser = new Set<number>();
    if (currentUserId) {
      const userSavedEntries = await this.db.query.savedPosts.findMany({
        where: eq(schema.savedPosts.userId, currentUserId),
        columns: { postId: true }
      });
      savedPostIdsForUser = new Set(userSavedEntries.map(sp => sp.postId));
    }

    // Augment posts with participants and saved status
    const postsWithDetails = fetchedPosts.map(post => {
      const participants = participantsByPostId.get(post.id) || [];
      return {
        ...post,
        // author and category are already included from the initial query
        postParticipants: participants, // Renaming to avoid conflict if Post type has 'participants'
        saved: currentUserId ? savedPostIdsForUser.has(post.id) : false,
      };
    });

    return postsWithDetails;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.db.query.posts.findFirst({
      where: eq(schema.posts.id, id),
    }) as Promise<Post | undefined>;
  }

  async createPost(post: Omit<InsertPost, 'authorId'>, authorId: number): Promise<Post> {
    const postPayload = {
        ...post,
        authorId: authorId, // Set authorId from parameter
        // timeAgo, createdAt, updatedAt handled by schema or will be part of 'post'
    };
    try {
      const result = await this.db.insert(schema.posts).values(postPayload).returning();
      return result[0] as Post;
    } catch (error: any) {
      console.error("Error in createPost:", error, "Payload:", postPayload);
      if (error.code === '23503') { // Foreign key violation
        console.error("Foreign key violation in createPost. Ensure authorId and categoryId (if provided) exist.");
      }
      throw error; // Re-throw the original error
    }
  }

  async savePost(currentUserId: number, postId: number, isSaved: boolean): Promise<void> {
    const existingSavedPost = await this.db.query.savedPosts.findFirst({
      where: and(
        eq(schema.savedPosts.postId, postId),
        eq(schema.savedPosts.userId, currentUserId)
      ),
    });

    if (isSaved) {
      if (!existingSavedPost) {
        await this.db.insert(schema.savedPosts).values({ postId, userId: currentUserId });
      }
    } else {
      if (existingSavedPost) {
        await this.db.delete(schema.savedPosts).where(eq(schema.savedPosts.id, existingSavedPost.id));
      }
    }
  }

  async getPostParticipants(postId: number): Promise<User[]> {
    const participantsRelations = await this.db.query.postParticipants.findMany({
      where: eq(schema.postParticipants.postId, postId),
      with: {
        user: true, // Assuming 'user' is the relation name for userId FK to users table
      },
    });
    return participantsRelations.map(pr => pr.user) as User[];
  }

  async getCategories(): Promise<Category[]> {
    return this.db.query.categories.findMany() as Promise<Category[]>;
  }
  async getCategory(id: number): Promise<Category | undefined> {
    return this.db.query.categories.findFirst({ where: eq(schema.categories.id, id) }) as Promise<Category | undefined>;
  }
  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(schema.categories).values(category).returning();
    return result[0] as Category;
  }

  async getDocuments(currentUserId: number | undefined, filter?: string, searchTerm?: string): Promise<any[]> { // Changed return type
    const conditions = [];
    if (searchTerm) {
      const term = `%${searchTerm.toLowerCase()}%`;
      conditions.push(like(sql`lower(${schema.documents.filename})`, term));
    }

    if (filter === "shared-by-me" && currentUserId) {
      conditions.push(eq(schema.documents.ownerId, currentUserId));
    } else if (filter === "shared-with-me" && currentUserId) {
      const sharedDocsRelations = await this.db.query.documentSharing.findMany({
        where: eq(schema.documentSharing.userId, currentUserId),
        columns: { documentId: true }
      });
      const sharedDocIds = sharedDocsRelations.map(sd => sd.documentId);
      if (sharedDocIds.length === 0) return [];
      conditions.push(sql`${schema.documents.id} IN ${sharedDocIds}`);
    } else if ((filter === "shared-by-me" || filter === "shared-with-me") && !currentUserId) {
      return [];
    } else if (filter && filter !== "all") { // Assuming filter is fileType
      conditions.push(eq(sql`lower(${schema.documents.fileType})`, filter.toLowerCase()));
    }

    const fetchedDocuments = await this.db.query.documents.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.documents.createdAt)],
      // Eager load owner if needed, but not strictly for sharedUsers optimization here
      // with: { owner: true }
    });

    if (fetchedDocuments.length === 0) return [];

    const documentIds = fetchedDocuments.map(doc => doc.id);

    // Fetch documentSharing entries for all retrieved documents, with user details
    const allDocumentSharings = await this.db.query.documentSharing.findMany({
      where: sql`${schema.documentSharing.documentId} IN ${documentIds}`,
      with: {
        user: { // This 'user' is from documentSharingRelations
          columns: {
            id: true,
            initials: true,
            specialty: true,
            // Add other fields if needed for frontend transformation
          }
        }
      }
    });

    const sharedUsersByDocId = new Map<number, User[]>();
    allDocumentSharings.forEach(ds => {
      if (!sharedUsersByDocId.has(ds.documentId)) {
        sharedUsersByDocId.set(ds.documentId, []);
      }
      if (ds.user) { // Ensure user is not null
        sharedUsersByDocId.get(ds.documentId)!.push(ds.user as User);
      }
    });

    // Augment documents with their shared users
    const documentsWithSharedUsers = fetchedDocuments.map(doc => ({
      ...doc,
      sharedUsers: sharedUsersByDocId.get(doc.id) || [],
    }));

    return documentsWithSharedUsers;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.db.query.documents.findFirst({
      where: eq(schema.documents.id, id),
    }) as Promise<Document | undefined>;
  }

  async createDocument(document: Omit<InsertDocument, 'ownerId'>, ownerId: number): Promise<Document> {
    const documentPayload = {
        ...document,
        ownerId: ownerId, // Set ownerId from parameter
        // timeAgo, createdAt, updatedAt handled by schema or will be part of 'document'
    };
    const result = await this.db.insert(schema.documents).values(documentPayload).returning();
    return result[0] as Document;
  }

  async shareDocument(documentId: number, userIds: number[]): Promise<void> {
    const existingShares = await this.db.query.documentSharing.findMany({
        where: and(
            eq(schema.documentSharing.documentId, documentId),
            sql`${schema.documentSharing.userId} in ${userIds}`
        )
    });
    const alreadySharedUserIds = new Set(existingShares.map(s => s.userId));

    const newShares = userIds
        .filter(uid => !alreadySharedUserIds.has(uid))
        .map(userId => ({ documentId, userId }));

    if (newShares.length > 0) {
        await this.db.insert(schema.documentSharing).values(newShares);
    }
  }
  async getDocumentSharedUsers(documentId: number): Promise<User[]> {
    const sharingRelations = await this.db.query.documentSharing.findMany({
        where: eq(schema.documentSharing.documentId, documentId),
        with: { user: true } // Assuming relation 'user' on documentSharing table for userId
    });
    return sharingRelations.map(sr => sr.user) as User[];
  }

  async getEvents(): Promise<Event[]> {
    return this.db.query.events.findMany({
      // Optional: Add ordering, e.g., by date
      orderBy: [desc(schema.events.date)],
      // Optional: Add relations if Event type in IStorage expects, e.g., eventType details
      // with: { eventType: true }
    }) as Promise<Event[]>;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.db.query.events.findFirst({
      where: eq(schema.events.id, id),
      // with: { eventType: true } // If needed for the Event type
    }) as Promise<Event | undefined>;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // InsertEvent is Zod-based. Drizzle expects fields of schema.events.
    // Ensure date is correctly formatted if needed, though pg driver usually handles Date objects.
    const eventPayload = {
        title: event.title,
        location: event.location,
        time: event.time,
        eventTypeId: event.eventTypeId,
        date: event.date, // Should be a Date object or ISO string
        // createdAt has defaultNow()
    };
    const result = await this.db.insert(schema.events).values(eventPayload).returning();
    return result[0] as Event;
  }

  async getEventTypes(): Promise<EventType[]> {
    return this.db.query.eventTypes.findMany() as Promise<EventType[]>;
  }
  async getEventType(id: number): Promise<EventType | undefined> {
    return this.db.query.eventTypes.findFirst({ where: eq(schema.eventTypes.id, id) }) as Promise<EventType | undefined>;
  }
  async createEventType(eventType: InsertEventType): Promise<EventType> {
    const result = await this.db.insert(schema.eventTypes).values(eventType).returning();
    return result[0] as EventType;
  }
  async getSpecialties(): Promise<string[]> {
    // selectDistinctOn is not standard SQL and might not be supported directly or require specific syntax.
    // A simpler way is to select all distinct specialties.
    const distinctSpecialties = await this.db.selectDistinct( {specialty: schema.users.specialty} ).from(schema.users);
    return distinctSpecialties.map(u => u.specialty).filter(s => s !== null) as string[];
  }
  async getStats(userId: number): Promise<Stat[]> {
    return this.db.query.stats.findMany({ where: eq(schema.stats.userId, userId) }) as Promise<Stat[]>;
  }
  async createStat(stat: InsertStat): Promise<Stat> {
    const result = await this.db.insert(schema.stats).values(stat).returning();
    return result[0] as Stat;
  }

  // Seed data method
  async seedDatabase(): Promise<void> {
    // Check if users exist, if so, assume seeding is done.
    const firstUser = await this.db.query.users.findFirst();
    if (firstUser) {
      console.log("Database already seeded.");
      return;
    }

    console.log("Seeding database...");

    // Create categories
    const catCardiology = await this.createCategory({ name: "Cardiology", color: "primary" });
    const catNeurology = await this.createCategory({ name: "Neurology", color: "secondary" });
    const catInfectiousDisease = await this.createCategory({ name: "Infectious Disease", color: "green-600" });

    // Create event types
    const etWebinar = await this.createEventType({ name: "Webinar", color: "primary" });
    const etWorkshop = await this.createEventType({ name: "Workshop", color: "secondary" });
    /*const etConference =*/ await this.createEventType({ name: "Conference", color: "accent/80" });

    // Create users
    // Note: `isConnected` was part of InsertUser from shared/schema but not in the db users table.
    // It's handled by the `connections` table.
    const userJohnWilson = await this.createUser({
      username: "johnwilson", password: "password", name: "Dr. John Wilson", title: "Cardiologist",
      organization: "Boston Medical Center", specialty: "Cardiology", location: "Boston, MA",
      initials: "JW", role: UserRole.enum.Doctor
    });

    const userJaneDavis = await this.createUser({
      username: "janedavis", password: "password", name: "Dr. Jane Davis", title: "Neurologist",
      organization: "Mass General Hospital", specialty: "Neurology", location: "Boston, MA",
      initials: "JD", role: UserRole.enum.Doctor
    });

    const userMichaelSmith = await this.createUser({
      username: "michaelsmith", password: "password", name: "Dr. Michael Smith", title: "Infectious Disease Specialist",
      organization: "Johns Hopkins", specialty: "Infectious Disease", location: "Baltimore, MD",
      initials: "MS", role: UserRole.enum.Patient
    });

    const userRebeccaJones = await this.createUser({
      username: "rebeccajones", password: "password", name: "Dr. Rebecca Jones", title: "Pulmonologist",
      organization: "Cleveland Clinic", specialty: "Pulmonology", location: "Cleveland, OH",
      initials: "RJ", role: UserRole.enum.Student
    });

     await this.createUser({
      username: "sarahadams", password: "password", name: "Dr. Sarah Adams", title: "Neurologist",
      organization: "Mass General Hospital", specialty: "Neurology", location: "Boston, MA",
      initials: "SA", role: UserRole.enum.Student
    });

     await this.createUser({
      username: "robertlee", password: "password", name: "Dr. Robert Lee", title: "Pulmonologist",
      organization: "Cleveland Clinic", specialty: "Pulmonology", location: "Cleveland, OH",
      initials: "RL", role: UserRole.enum.Patient
    });

     await this.createUser({
      username: "karenpark", password: "password", name: "Dr. Karen Park", title: "Cardiologist",
      organization: "Mayo Clinic", specialty: "Cardiology", location: "Rochester, MN",
      initials: "KP", role: UserRole.enum.Doctor
    });

    // Create user profile
    await this.createProfile({
      userId: userJohnWilson.id, profileCompletion: 85, remainingItems: 3,
      networkGrowth: 12, networkGrowthDays: 30
    });

    // Create connections based on original MemStorage's isConnected flags
    if (userJohnWilson && userJaneDavis) { // Jane was isConnected: true for John in MemStorage (implicitly)
        await this.createConnection(userJohnWilson.id, userJaneDavis.id);
        // Accept the connection immediately for seeding
        await this.db.update(schema.connections)
            .set({ status: "accepted" })
            .where(and(eq(schema.connections.userId, userJohnWilson.id), eq(schema.connections.connectedUserId, userJaneDavis.id)));
    }
    // Michael Smith was isConnected: true
    const userMichael = await this.getUserByUsername("michaelsmith");
    if (userJohnWilson && userMichael) { // Example: connect John to Michael
         await this.createConnection(userJohnWilson.id, userMichael.id);
         await this.db.update(schema.connections)
            .set({ status: "accepted" })
            .where(and(eq(schema.connections.userId, userJohnWilson.id), eq(schema.connections.connectedUserId, userMichael.id)));
    }
     // Rebecca Jones was isConnected: true
    const userRebecca = await this.getUserByUsername("rebeccajones");
    if (userJaneDavis && userRebecca) { // Example: connect Jane to Rebecca
        await this.createConnection(userJaneDavis.id, userRebecca.id);
        await this.db.update(schema.connections)
            .set({ status: "accepted" })
            .where(and(eq(schema.connections.userId, userJaneDavis.id), eq(schema.connections.connectedUserId, userRebecca.id)));
    }


    // Create posts
    const post1 = await this.createPost({
      title: "New JAMA Study: Long-term Outcomes of TAVR vs. SAVR in High-Risk Patients",
      content: "This groundbreaking research provides new insights into comparative outcomes for transcatheter and surgical aortic valve replacement procedures...",
      authorId: userJohnWilson.id, categoryId: catCardiology.id, timeAgo: "2 days ago",
    });

    const post2 = await this.createPost({
      title: "FDA Approves Novel Treatment for Early-Stage Alzheimer's Disease",
      content: "The FDA has granted approval for a new treatment targeting amyloid plaques, showing modest but meaningful cognitive benefits in early-stage patients...",
      authorId: userJaneDavis.id, categoryId: catNeurology.id, timeAgo: "4 days ago",
    });

    await this.createPost({
      title: "Updated CDC Guidelines for Managing Antibiotic-Resistant Infections",
      content: "New recommendations provide updated protocols for addressing the growing challenge of antimicrobial resistance in clinical settings...",
      authorId: userMichaelSmith.id, categoryId: catInfectiousDisease.id, timeAgo: "1 week ago",
    });

    // Create post participants
    await this.db.insert(schema.postParticipants).values([
        { postId: post1.id, userId: userJaneDavis.id },
        { postId: post1.id, userId: userMichaelSmith.id },
        { postId: post2.id, userId: userRebeccaJones.id },
        { postId: post2.id, userId: userJohnWilson.id },
    ]);

    // Create documents
    const doc1 = await this.createDocument({
      filename: "Patient Case Analysis Q2.pdf", fileType: "PDF", ownerId: userJohnWilson.id, timeAgo: "2 days ago",
    });
    await this.createDocument({
      filename: "Treatment Effectiveness Data.xlsx", fileType: "Excel", ownerId: userJohnWilson.id, timeAgo: "5 days ago",
    });

    // Share documents
    await this.shareDocument(doc1.id, [userJaneDavis.id, userMichaelSmith.id]);

    // Create events
    await this.createEvent({
      title: "Advances in Cardiac Imaging Webinar", location: "Virtual Event", time: "2:00 PM - 3:30 PM EST",
      eventTypeId: etWebinar.id, date: new Date(2023, 4, 15), // Month is 0-indexed
    });

    // Create stats
    await this.createStat({userId: userJohnWilson.id, title: "New Research Articles", value: 24, icon: "article", iconColor: "text-primary", change: 12, timeframe: "last week"});
    await this.createStat({userId: userJohnWilson.id, title: "Network Connections", value: 128, icon: "people", iconColor: "text-secondary", change: 8, timeframe: "last month"});


    console.log("Database seeding completed.");
  }
  // Connection lifecycle methods implementations
  async getConnectionById(connectionId: number): Promise<Connection | undefined> {
    return this.db.query.connections.findFirst({
      where: eq(schema.connections.id, connectionId),
      with: {
        user: true, // User who initiated
        connectedUser: true // User who received
      }
    }) as Promise<Connection | undefined>;
  }

  async updateConnectionStatus(connectionId: number, status: typeof schema.connections.status.enumValues[number]): Promise<Connection | undefined> {
    const result = await this.db.update(schema.connections)
      .set({ status: status, updatedAt: new Date() }) // Also update updatedAt timestamp
      .where(eq(schema.connections.id, connectionId))
      .returning();
    return result[0] as Connection | undefined;
  }

  async getConnectionsForUser(userId: number, status?: typeof schema.connections.status.enumValues[number]): Promise<Connection[]> {
    const conditions = [
      or(
        eq(schema.connections.userId, userId),
        eq(schema.connections.connectedUserId, userId)
      )
    ];
    if (status) {
      conditions.push(eq(schema.connections.status, status));
    }
    return this.db.query.connections.findMany({
      where: and(...conditions),
      with: { // Include details of both users in the connection
        user: true,
        connectedUser: true
      }
    }) as Promise<Connection[]>;
  }

  async getMutualConnections(userId1: number, userId2: number): Promise<User[]> {
    // Get accepted connections for userId1
    const connections1 = await this.db.query.connections.findMany({
      where: and(
        or(eq(schema.connections.userId, userId1), eq(schema.connections.connectedUserId, userId1)),
        eq(schema.connections.status, 'accepted')
      ),
    });
    const connectedIds1 = new Set(connections1.map(c => c.userId === userId1 ? c.connectedUserId : c.userId));

    // Get accepted connections for userId2
    const connections2 = await this.db.query.connections.findMany({
      where: and(
        or(eq(schema.connections.userId, userId2), eq(schema.connections.connectedUserId, userId2)),
        eq(schema.connections.status, 'accepted')
      ),
    });
    const connectedIds2 = new Set(connections2.map(c => c.userId === userId2 ? c.connectedUserId : c.userId));

    // Find mutual connection IDs
    const mutualIds = [...connectedIds1].filter(id => connectedIds2.has(id));

    if (mutualIds.length === 0) {
      return [];
    }

    // Fetch user details for mutual connections
    return this.db.query.users.findMany({
      where: sql`${schema.users.id} in ${mutualIds}`
    }) as Promise<User[]>;
  }
}

// Export an instance of DrizzleStorage
export const storage = new DrizzleStorage();

// Comment out MemStorage to avoid conflicts or if it's no longer needed.
// Or export it under a different name if it's needed for comparison/testing.
/*
export class MemStorage implements IStorage {
  // ... (original MemStorage code)
}
// export const storage = new MemStorage(); // Original instantiation
*/
