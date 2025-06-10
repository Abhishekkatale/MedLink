import { 
  users, User, InsertUser,
  profiles, Profile, InsertProfile,
  posts, Post, InsertPost,
  categories, Category, InsertCategory,
  documents, Document, InsertDocument,
  events, Event, InsertEvent,
  eventTypes, EventType, InsertEventType,
  documentSharing, DocumentSharing, InsertDocumentSharing,
  postParticipants, PostParticipant, InsertPostParticipant,
  savedPosts, SavedPost, InsertSavedPost,
  connections, Connection, InsertConnection,
  stats, Stat, InsertStat,
  UserRole // Import UserRole
} from "@shared/schema";
import * as bcrypt from 'bcrypt'; // Import bcrypt

export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUsersBySpecialty(specialty: string): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>; // InsertUser already includes role
  verifyPassword(password: string, hash: string): Promise<boolean>; // Add verifyPassword to interface
  getCurrentUser(): Promise<User | undefined>;
  getUserColleagues(userId: number): Promise<User[]>;
  getUserSuggestions(userId: number): Promise<User[]>;
  getConnectionRequests(userId: number): Promise<User[]>;
  createConnection(userId: number, connectedUserId: number): Promise<Connection>;
  
  // Profile methods
  getProfile(userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: number, profile: Partial<Profile>): Promise<Profile | undefined>;
  
  // Posts methods
  getPosts(filter?: string, searchTerm?: string, categoryId?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  savePost(postId: number, userId: number, isSaved: boolean): Promise<void>;
  getPostParticipants(postId: number): Promise<User[]>;
  
  // Categories methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Documents methods
  getDocuments(filter?: string, searchTerm?: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  shareDocument(documentId: number, userIds: number[]): Promise<void>;
  getDocumentSharedUsers(documentId: number): Promise<User[]>;
  
  // Events methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Event types methods
  getEventTypes(): Promise<EventType[]>;
  getEventType(id: number): Promise<EventType | undefined>;
  createEventType(eventType: InsertEventType): Promise<EventType>;
  
  // Specialty methods
  getSpecialties(): Promise<string[]>;
  
  // Stats methods
  getStats(userId: number): Promise<Stat[]>;
  createStat(stat: InsertStat): Promise<Stat>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private profilesData: Map<number, Profile>;
  private postsData: Map<number, Post>;
  private categoriesData: Map<number, Category>;
  private documentsData: Map<number, Document>;
  private eventsData: Map<number, Event>;
  private eventTypesData: Map<number, EventType>;
  private documentSharingData: Map<number, DocumentSharing>;
  private postParticipantsData: Map<number, PostParticipant>;
  private savedPostsData: Map<number, SavedPost>;
  private connectionsData: Map<number, Connection>;
  private statsData: Map<number, Stat>;
  
  private currentUserId: number = 1; // For demo purposes, we'll assume user 1 is logged in
  private userId: number = 1;
  private profileId: number = 1;
  private postId: number = 1;
  private categoryId: number = 1;
  private documentId: number = 1;
  private eventId: number = 1;
  private eventTypeId: number = 1;
  private documentSharingId: number = 1;
  private postParticipantId: number = 1;
  private savedPostId: number = 1;
  private connectionId: number = 1;
  private statId: number = 1;
  
  constructor() {
    this.usersData = new Map();
    this.profilesData = new Map();
    this.postsData = new Map();
    this.categoriesData = new Map();
    this.documentsData = new Map();
    this.eventsData = new Map();
    this.eventTypesData = new Map();
    this.documentSharingData = new Map();
    this.postParticipantsData = new Map();
    this.savedPostsData = new Map();
    this.connectionsData = new Map();
    this.statsData = new Map();
    
    this.initializeData();
  }
  
  // Initialize some sample data
  private initializeData() {
    // Create categories
    const cardiology = this.createCategory({ name: "Cardiology", color: "primary" });
    const neurology = this.createCategory({ name: "Neurology", color: "secondary" });
    const infectiousDisease = this.createCategory({ name: "Infectious Disease", color: "green-600" });
    
    // Create event types
    const webinar = this.createEventType({ name: "Webinar", color: "primary" });
    const workshop = this.createEventType({ name: "Workshop", color: "secondary" });
    const conference = this.createEventType({ name: "Conference", color: "accent/80" });
    
    // Create some users
    const saltRounds = 10;
    const johnWilson = this.createUser({
      username: "johnwilson",
      password: "password", // Will be hashed by createUser
      name: "Dr. John Wilson",
      title: "Cardiologist",
      organization: "Boston Medical Center",
      specialty: "Cardiology",
      location: "Boston, MA",
      initials: "JW",
      isConnected: false,
      role: UserRole.Values.superadmin
    });

    this.createUser({
      username: "janedavis",
      password: "password", // Will be hashed by createUser
      name: "Dr. Jane Davis",
      title: "Neurologist",
      organization: "Mass General Hospital",
      specialty: "Neurology",
      location: "Boston, MA",
      initials: "JD",
      isConnected: true,
      role: UserRole.Values.admin
    });

    this.createUser({
      username: "michaelsmith",
      password: "password", // Will be hashed by createUser
      name: "Dr. Michael Smith",
      title: "Infectious Disease Specialist",
      organization: "Johns Hopkins",
      specialty: "Infectious Disease",
      location: "Baltimore, MD",
      initials: "MS",
      isConnected: true,
      role: UserRole.Values.patient
    });

    this.createUser({
      username: "rebeccajones",
      password: "password", // Will be hashed by createUser
      name: "Dr. Rebecca Jones",
      title: "Pulmonologist",
      organization: "Cleveland Clinic",
      specialty: "Pulmonology",
      location: "Cleveland, OH",
      initials: "RJ",
      isConnected: true,
      role: UserRole.Values.patient
    });

    // Add some user suggestions
    this.createUser({
      username: "sarahadams",
      password: "password", // Will be hashed by createUser
      name: "Dr. Sarah Adams",
      title: "Neurologist",
      organization: "Mass General Hospital",
      specialty: "Neurology",
      location: "Boston, MA",
      initials: "SA",
      isConnected: false,
      role: UserRole.Values.patient
    });

    this.createUser({
      username: "robertlee",
      password: "password", // Will be hashed by createUser
      name: "Dr. Robert Lee",
      title: "Pulmonologist",
      organization: "Cleveland Clinic",
      specialty: "Pulmonology",
      location: "Cleveland, OH",
      initials: "RL",
      isConnected: false,
      role: UserRole.Values.patient
    });

    this.createUser({
      username: "karenpark",
      password: "password", // Will be hashed by createUser
      name: "Dr. Karen Park",
      title: "Cardiologist",
      organization: "Mayo Clinic",
      specialty: "Cardiology",
      location: "Rochester, MN",
      initials: "KP",
      isConnected: false,
      role: UserRole.Values.patient
    });
    
    // Create user profile
    this.createProfile({
      userId: johnWilson.id,
      profileCompletion: 85,
      remainingItems: 3,
      networkGrowth: 12,
      networkGrowthDays: 30
    });
    
    // Create posts
    this.createPost({
      title: "New JAMA Study: Long-term Outcomes of TAVR vs. SAVR in High-Risk Patients",
      content: "This groundbreaking research provides new insights into comparative outcomes for transcatheter and surgical aortic valve replacement procedures...",
      authorId: johnWilson.id,
      categoryId: cardiology.id,
      timeAgo: "2 days ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.createPost({
      title: "FDA Approves Novel Treatment for Early-Stage Alzheimer's Disease",
      content: "The FDA has granted approval for a new treatment targeting amyloid plaques, showing modest but meaningful cognitive benefits in early-stage patients...",
      authorId: 2, // Jane Davis
      categoryId: neurology.id,
      timeAgo: "4 days ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.createPost({
      title: "Updated CDC Guidelines for Managing Antibiotic-Resistant Infections",
      content: "New recommendations provide updated protocols for addressing the growing challenge of antimicrobial resistance in clinical settings...",
      authorId: 3, // Michael Smith
      categoryId: infectiousDisease.id,
      timeAgo: "1 week ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create some post participants
    this.createPostParticipant(1, 2); // Jane Davis discussing post 1
    this.createPostParticipant(1, 3); // Michael Smith discussing post 1
    this.createPostParticipant(2, 4); // Rebecca Jones discussing post 2
    this.createPostParticipant(2, 1); // John Wilson discussing post 2
    this.createPostParticipant(2, 2); // Jane Davis discussing post 2
    this.createPostParticipant(3, 2); // Jane Davis discussing post 3
    
    // Create documents
    this.createDocument({
      filename: "Patient Case Analysis Q2.pdf",
      fileType: "PDF",
      ownerId: johnWilson.id,
      timeAgo: "2 days ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.createDocument({
      filename: "Treatment Effectiveness Data.xlsx",
      fileType: "Excel",
      ownerId: johnWilson.id,
      timeAgo: "5 days ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.createDocument({
      filename: "Cardiology Conference Slides.pptx",
      fileType: "PPT",
      ownerId: johnWilson.id,
      timeAgo: "1 week ago",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Share documents
    this.shareDocument(1, [2, 3]); // Share with Jane Davis and Michael Smith
    this.shareDocument(2, [4]); // Share with Rebecca Jones
    
    // Create events
    this.createEvent({
      title: "Advances in Cardiac Imaging Webinar",
      location: "Virtual Event",
      time: "2:00 PM - 3:30 PM EST",
      eventTypeId: webinar.id,
      date: new Date(2023, 4, 15), // May 15, 2023
      createdAt: new Date()
    });
    
    this.createEvent({
      title: "Clinical Research Methodology Workshop",
      location: "Boston Medical Center",
      time: "9:00 AM - 4:00 PM",
      eventTypeId: workshop.id,
      date: new Date(2023, 5, 8), // June 8, 2023
      createdAt: new Date()
    });
    
    // Create stats
    this.createStat({
      userId: johnWilson.id,
      title: "New Research Articles",
      value: 24,
      icon: "article",
      iconColor: "text-primary",
      change: 12,
      timeframe: "last week"
    });
    
    this.createStat({
      userId: johnWilson.id,
      title: "Network Connections",
      value: 128,
      icon: "people",
      iconColor: "text-secondary",
      change: 8,
      timeframe: "last month"
    });
    
    this.createStat({
      userId: johnWilson.id,
      title: "Document Shares",
      value: 16,
      icon: "folder_shared",
      iconColor: "text-accent/80",
      change: -3,
      timeframe: "last week"
    });
    
    this.createStat({
      userId: johnWilson.id,
      title: "Pending Responses",
      value: 7,
      icon: "question_answer",
      iconColor: "text-yellow-500",
      change: -5,
      timeframe: "yesterday"
    });
  }
  
  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }
  
  async getUsersBySpecialty(specialty: string): Promise<User[]> {
    return Array.from(this.usersData.values()).filter(
      (user) => user.specialty === specialty
    );
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
    // The `role` property is part of `InsertUser` type and will be included in `...user`
    const newUser: User = { ...user, id, password: hashedPassword };
    this.usersData.set(id, newUser);
    return newUser;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compareSync(password, hash);
  }

  async getCurrentUser(): Promise<User | undefined> {
    return this.usersData.get(this.currentUserId);
  }
  
  async getUserColleagues(userId: number): Promise<User[]> {
    // In this simple implementation, we return users that are marked as connected
    return Array.from(this.usersData.values()).filter(
      (user) => user.id !== userId && user.isConnected
    );
  }
  
  async getUserSuggestions(userId: number): Promise<User[]> {
    // Return users that are not connected and not the current user
    return Array.from(this.usersData.values()).filter(
      (user) => user.id !== userId && !user.isConnected
    );
  }
  
  async getConnectionRequests(userId: number): Promise<User[]> {
    // Get pending connection requests
    const pendingConnections = Array.from(this.connectionsData.values()).filter(
      (conn) => conn.connectedUserId === userId && conn.status === "pending"
    );
    
    // Get the users who made these requests
    const users: User[] = [];
    for (const conn of pendingConnections) {
      const user = await this.getUser(conn.userId);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  async createConnection(userId: number, connectedUserId: number): Promise<Connection> {
    const id = this.connectionId++;
    const connection: Connection = {
      id,
      userId,
      connectedUserId,
      status: "pending",
      createdAt: new Date()
    };
    this.connectionsData.set(id, connection);
    return connection;
  }
  
  // Profile methods
  async getProfile(userId: number): Promise<Profile | undefined> {
    return Array.from(this.profilesData.values()).find(
      (profile) => profile.userId === userId
    );
  }
  
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = this.profileId++;
    const newProfile = { ...profile, id };
    this.profilesData.set(id, newProfile);
    return newProfile;
  }
  
  async updateProfile(userId: number, updates: Partial<Profile>): Promise<Profile | undefined> {
    const profile = await this.getProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...updates };
    this.profilesData.set(profile.id, updatedProfile);
    return updatedProfile;
  }
  
  // Posts methods
  async getPosts(filter?: string, searchTerm?: string, categoryId?: string): Promise<Post[]> {
    let posts = Array.from(this.postsData.values());
    
    if (filter === "saved") {
      // Get saved posts for current user
      const savedPostIds = Array.from(this.savedPostsData.values())
        .filter((sp) => sp.userId === this.currentUserId)
        .map((sp) => sp.postId);
      
      posts = posts.filter((post) => savedPostIds.includes(post.id));
    }
    
    if (categoryId && categoryId !== "all") {
      posts = posts.filter((post) => post.categoryId === parseInt(categoryId));
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(lowerSearchTerm) ||
          post.content.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return posts;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.postsData.get(id);
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.postId++;
    const newPost = { ...post, id };
    this.postsData.set(id, newPost);
    return newPost;
  }
  
  async savePost(postId: number, userId: number, isSaved: boolean): Promise<void> {
    // Find existing saved post
    const existingSaved = Array.from(this.savedPostsData.values()).find(
      (sp) => sp.postId === postId && sp.userId === userId
    );
    
    if (isSaved && !existingSaved) {
      // Save the post
      const id = this.savedPostId++;
      const savedPost: SavedPost = { id, postId, userId };
      this.savedPostsData.set(id, savedPost);
    } else if (!isSaved && existingSaved) {
      // Unsave the post
      this.savedPostsData.delete(existingSaved.id);
    }
  }
  
  async getPostParticipants(postId: number): Promise<User[]> {
    // Get participant records for the post
    const participants = Array.from(this.postParticipantsData.values()).filter(
      (pp) => pp.postId === postId
    );
    
    // Get the user objects
    const users: User[] = [];
    for (const pp of participants) {
      const user = await this.getUser(pp.userId);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  private createPostParticipant(postId: number, userId: number): PostParticipant {
    const id = this.postParticipantId++;
    const participant: PostParticipant = { id, postId, userId };
    this.postParticipantsData.set(id, participant);
    return participant;
  }
  
  // Categories methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesData.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoriesData.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory = { ...category, id };
    this.categoriesData.set(id, newCategory);
    return newCategory;
  }
  
  // Documents methods
  async getDocuments(filter?: string, searchTerm?: string): Promise<Document[]> {
    let documents = Array.from(this.documentsData.values());
    
    if (filter === "shared-by-me") {
      // Get documents shared by current user
      const documentIds = new Set(
        Array.from(this.documentSharingData.values())
          .filter((ds) => {
            const doc = this.documentsData.get(ds.documentId);
            return doc && doc.ownerId === this.currentUserId;
          })
          .map((ds) => ds.documentId)
      );
      
      documents = documents.filter((doc) => documentIds.has(doc.id));
    } else if (filter === "shared-with-me") {
      // Get documents shared with current user
      const documentIds = new Set(
        Array.from(this.documentSharingData.values())
          .filter((ds) => ds.userId === this.currentUserId)
          .map((ds) => ds.documentId)
      );
      
      documents = documents.filter((doc) => documentIds.has(doc.id));
    } else if (filter && filter !== "all") {
      // Filter by document type
      documents = documents.filter((doc) => doc.fileType.toLowerCase() === filter.toLowerCase());
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      documents = documents.filter((doc) =>
        doc.filename.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return documents;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsData.get(id);
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const newDocument = { ...document, id };
    this.documentsData.set(id, newDocument);
    return newDocument;
  }
  
  async shareDocument(documentId: number, userIds: number[]): Promise<void> {
    for (const userId of userIds) {
      // Check if already shared
      const isAlreadyShared = Array.from(this.documentSharingData.values()).some(
        (ds) => ds.documentId === documentId && ds.userId === userId
      );
      
      if (!isAlreadyShared) {
        const id = this.documentSharingId++;
        const sharing: DocumentSharing = {
          id,
          documentId,
          userId,
          createdAt: new Date()
        };
        this.documentSharingData.set(id, sharing);
      }
    }
  }
  
  async getDocumentSharedUsers(documentId: number): Promise<User[]> {
    // Get sharing records for the document
    const sharings = Array.from(this.documentSharingData.values()).filter(
      (ds) => ds.documentId === documentId
    );
    
    // Get the user objects
    const users: User[] = [];
    for (const ds of sharings) {
      const user = await this.getUser(ds.userId);
      if (user) users.push(user);
    }
    
    return users;
  }
  
  // Events methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.eventsData.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsData.get(id);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const newEvent = { ...event, id };
    this.eventsData.set(id, newEvent);
    return newEvent;
  }
  
  // Event types methods
  async getEventTypes(): Promise<EventType[]> {
    return Array.from(this.eventTypesData.values());
  }
  
  async getEventType(id: number): Promise<EventType | undefined> {
    return this.eventTypesData.get(id);
  }
  
  async createEventType(eventType: InsertEventType): Promise<EventType> {
    const id = this.eventTypeId++;
    const newEventType = { ...eventType, id };
    this.eventTypesData.set(id, newEventType);
    return newEventType;
  }
  
  // Specialty methods
  async getSpecialties(): Promise<string[]> {
    const specialties = new Set<string>();
    for (const user of this.usersData.values()) {
      specialties.add(user.specialty);
    }
    return Array.from(specialties);
  }
  
  // Stats methods
  async getStats(userId: number): Promise<Stat[]> {
    return Array.from(this.statsData.values()).filter(
      (stat) => stat.userId === userId
    );
  }
  
  async createStat(stat: InsertStat): Promise<Stat> {
    const id = this.statId++;
    const newStat = { ...stat, id };
    this.statsData.set(id, newStat);
    return newStat;
  }
}

export const storage = new MemStorage();
