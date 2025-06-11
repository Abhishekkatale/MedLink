import type { Express, Request, Response } from "express";
import { createServer, type Server, IncomingMessage } from "http";
import PDFDocument from 'pdfkit';
import { storage } from "./storage";
import { UserRole, updateUserProfileSchema, createCommentSchema } from "@shared/schema"; // Import UserRole, updateUserProfileSchema, and createCommentSchema
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { insertPostSchema, insertDocumentSchema, insertConnectionSchema, insertUserSchema, User } from "@shared/schema"; // Added insertUserSchema & User
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Define a JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-for-dev";

// Extend Express Request type to include 'user' property
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string; // Or UserRole if you parse it strictly
  };
}

// Set up paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up multer for file uploads
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleErrors = (err: Error, res: Response) => {
    console.error("API Error:", err);
    
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // JWT Authentication Middleware
  const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer <token>
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403); // Forbidden
        }
        req.user = user as AuthenticatedRequest['user'];
        next();
      });
    } else {
      res.sendStatus(401); // Unauthorized
    }
  };

  // RBAC Middleware
  const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: Function) => {
      if (!req.user || !req.user.role) {
        return res.sendStatus(401); // Unauthorized if user or role is not set
      }

      const rolesArray = allowedRoles;
      if (!rolesArray.includes(req.user.role)) {
        return res.sendStatus(403); // Forbidden if role is not allowed
      }
      next();
    };
  };

  // --- AUTH ROUTES ---
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, role, name, title, organization, specialty, location, initials } = req.body;

      // Validate role
      if (!UserRole.options.includes(role)) {
        return res.status(400).json({ message: "Invalid role provided." });
      }

      // Basic validation
      if (!username || !password || !role || !name) {
        return res.status(400).json({ message: "Username, password, role, and name are required." });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists." });
      }

      // Validate with insertUserSchema (excluding id, which is auto-generated)
      const parsedData = insertUserSchema.safeParse({
        username,
        password, // Raw password, createUser will hash it
        role,
        name,
        title: title || "", // Provide defaults for optional fields if necessary
        organization: organization || "",
        specialty: specialty || "",
        location: location || "",
        initials: initials || ""
      });

      if (!parsedData.success) {
        throw parsedData.error;
      }

      const newUser = await storage.createUser(parsedData.data);

      const tokenPayload = { id: newUser.id, username: newUser.username, role: newUser.role };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({ token, user: {id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password, rememberMe } = req.body; // Added rememberMe
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const isPasswordValid = await storage.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      
      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      // Adjust token expiration based on rememberMe
      const expiresIn = rememberMe ? '7d' : '1h'; // 7 days if rememberMe is true, else 1 hour
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });

      // Return only non-sensitive user info
      const userToReturn = { id: user.id, username: user.username, name: user.name, role: user.role, title: user.title, organization: user.organization, specialty: user.specialty, location: user.location, initials: user.initials, isConnected: user.isConnected };

      res.json({ token, user: userToReturn });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // --- USER ROUTES ---
  // Current user endpoint - now uses JWT
  app.get("/api/users/current", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // req.user is populated by authenticateJWT middleware
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return only non-sensitive user info
      const userToReturn = { id: user.id, username: user.username, name: user.name, role: user.role, title: user.title, organization: user.organization, specialty: user.specialty, location: user.location, initials: user.initials, isConnected: user.isConnected };
      res.json(userToReturn);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get user colleagues - This and subsequent routes still use storage.getCurrentUser()
  // They would need to be updated to use authenticateJWT and req.user.id in a real scenario
  app.get("/api/users/colleagues", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const colleagues = await storage.getUserColleagues(req.user.id);
      
      // Transform data for frontend
      const colleaguesDisplay = colleagues.map(colleague => ({
        id: colleague.id,
        name: colleague.name,
        initials: colleague.initials,
        colorClass: getColorClass(colleague.specialty)
      }));
      
      res.json(colleaguesDisplay);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get user suggestions
  app.get("/api/users/suggestions", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const suggestions = await storage.getUserSuggestions(req.user.id);
      
      // Transform data for frontend
      const sugsTransformed = suggestions.map(user => ({
        id: user.id,
        name: user.name,
        specialty: user.specialty,
        organization: user.organization,
        initials: user.initials,
        colorClass: getColorClass(user.specialty),
        mutualConnections: Math.floor(Math.random() * 15) + 1 // In real app, get actual mutual connections
      }));
      
      res.json(sugsTransformed);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get user profile
  app.get("/api/users/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      // Fetch the full user details for the profile page based on authenticated user's ID
      const userForProfile = await storage.getUser(req.user.id);
      if (!userForProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getProfile(req.user.id);
      if (!profile) {
        // It's possible a user might not have a profile entry yet.
        // Depending on requirements, either return 404 or a default/partial profile.
        // For now, let's assume a profile entry should exist or this is an issue.
        return res.status(404).json({ message: "Profile not found for this user." });
      }
      
      // Combine user and profile data
      const userProfile = {
        ...profile, // Spread profile data first
        name: userForProfile.name, // Then override/add user-specific data
        title: userForProfile.title,
        organization: userForProfile.organization,
        initials: userForProfile.initials
        // Add any other fields from `userForProfile` needed by the frontend profile page
      };
      
      res.json(userProfile);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // Update user profile
  app.put("/api/users/profile", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validationResult = updateUserProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        // Use fromZodError to create a user-friendly error message if you want
        // For now, just sending the raw errors
        return res.status(400).json({ message: "Invalid data provided", errors: validationResult.error.flatten() });
      }

      const validatedData = validationResult.data;

      // Ensure no forbidden fields are passed, though Zod schema should handle this.
      // The updateUser method in storage also prevents updating role, password, etc.
      const updatedUser = await storage.updateUser(req.user.id, validatedData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found or update failed" });
      }

      // Return only non-sensitive user info
      const { password, ...userToReturn } = updatedUser;
      res.json(userToReturn);

    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // Profile picture upload route
  app.post("/api/users/profile/picture", authenticateJWT, upload.single('profilePicture'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No profile picture file uploaded." });
      }

      const fileUrl = `/uploads/${req.file.filename}`; // Construct file URL

      // Update user's profilePictureUrl in the database
      const updatedUser = await storage.updateUser(req.user.id, { profilePictureUrl: fileUrl });

      if (!updatedUser) {
        // This case should ideally not happen if user is authenticated and updateUser works
        return res.status(404).json({ message: "User not found or update failed after upload." });
      }

      // Return the new profile picture URL and/or the updated user object (excluding sensitive info)
      const { password, ...userToReturn } = updatedUser;
      res.json({
        message: "Profile picture updated successfully.",
        profilePictureUrl: fileUrl,
        user: userToReturn
      });

    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get connection requests
  app.get("/api/users/connection-requests", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const requests = await storage.getConnectionRequests(req.user.id);
      res.json(requests);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Create connection
  app.post("/api/connections/connect", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const parsedData = insertConnectionSchema.safeParse({
        userId: req.user.id, // Initiator of the connection
        connectedUserId: req.body.userId, // Target user ID from request body
        status: "pending"
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      
      const connection = await storage.createConnection(
        req.user.id,
        req.body.userId
      );
      
      res.status(201).json(connection);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // --- CONNECTION ROUTES ---
  // (createConnection is already above, this adds accept/reject and listing)

  app.post("/api/connections/:connectionId/accept", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "User not authenticated" });

      const connectionId = parseInt(req.params.connectionId);
      if (isNaN(connectionId)) return res.status(400).json({ message: "Invalid connection ID" });

      const connection = await storage.getConnectionById(connectionId);
      if (!connection) return res.status(404).json({ message: "Connection not found" });

      // Verify that the authenticated user is the recipient (connectedUserId) of the connection request
      if (connection.connectedUserId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You cannot accept this connection request." });
      }
      if (connection.status !== 'pending') {
        return res.status(400).json({ message: `Connection is already ${connection.status}.`});
      }

      const updatedConnection = await storage.updateConnectionStatus(connectionId, 'accepted');
      res.json(updatedConnection);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  app.post("/api/connections/:connectionId/reject", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "User not authenticated" });

      const connectionId = parseInt(req.params.connectionId);
      if (isNaN(connectionId)) return res.status(400).json({ message: "Invalid connection ID" });

      const connection = await storage.getConnectionById(connectionId);
      if (!connection) return res.status(404).json({ message: "Connection not found" });

      // Verify that the authenticated user is the recipient (connectedUserId)
      if (connection.connectedUserId !== req.user.id) {
         // Or, allow initiator to cancel their own pending request
         if (connection.userId === req.user.id && connection.status === 'pending') {
            // Allow initiator to reject/cancel their own pending request
         } else {
            return res.status(403).json({ message: "Forbidden: You cannot reject this connection request." });
         }
      }
      if (connection.status !== 'pending') {
        return res.status(400).json({ message: `Connection is already ${connection.status}.`});
      }

      const updatedConnection = await storage.updateConnectionStatus(connectionId, 'rejected');
      res.json(updatedConnection);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // Get connections for the authenticated user (can filter by status: 'pending', 'accepted', 'rejected')
  app.get("/api/connections", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "User not authenticated" });

      const status = req.query.status as typeof schema.connections.status.enumValues[number] | undefined;
      if (status && !['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status filter." });
      }

      const connections = await storage.getConnectionsForUser(req.user.id, status);
      res.json(connections);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  app.get("/api/users/:userId/mutual-connections/:otherUserId", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const otherUserId = parseInt(req.params.otherUserId);

      if (isNaN(userId) || isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user IDs provided." });
      }

      const mutualConnections = await storage.getMutualConnections(userId, otherUserId);
      res.json(mutualConnections);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // Get users directory
  app.get("/api/users/directory", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const searchTerm = req.query.searchTerm as string | undefined;
      const specialtyFilter = req.query.specialtyFilter as string | undefined;
      const showConnected = req.query.showConnected === "true";
      
      if (!req.user) { // Required for filtering out self and potentially for 'showConnected' logic
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get all users or filtered by specialty
      let users;
      if (specialtyFilter && specialtyFilter !== "all") {
        users = await storage.getUsersBySpecialty(specialtyFilter);
      } else {
        users = await storage.getUsers();
      }
      
      // Filter out current user
      users = users.filter(user => user.id !== req.user!.id);
      
      // Filter by connection status if needed
      if (showConnected) {
        users = users.filter(user => user.isConnected);
      }
      
      // Filter by search term if provided
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        users = users.filter(
          user =>
            user.name.toLowerCase().includes(lowerSearchTerm) ||
            user.specialty.toLowerCase().includes(lowerSearchTerm) ||
            user.organization.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      res.json(users);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get specialties
  app.get("/api/specialties", async (req: Request, res: Response) => {
    try {
      const specialties = await storage.getSpecialties();
      res.json(specialties);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get stats
  app.get("/api/stats", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const stats = await storage.getStats(req.user.id);
      res.json(stats);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get posts
  app.get("/api/posts", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      const searchTerm = req.query.searchTerm as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      
      // Pass currentUserId (if available) for 'saved' filter, otherwise undefined
      const currentUserId = req.user?.id;
      const posts = await storage.getPosts(currentUserId, filter, searchTerm, categoryId);
      
      // Get full post data with author and participants
      const postsWithData = await Promise.all(posts.map(async post => {
        const author = await storage.getUser(post.authorId);
        const category = await storage.getCategory(post.categoryId);
        const participants = await storage.getPostParticipants(post.id);
        
        let isSaved = false;
        if (currentUserId) {
          // Check if this specific post is saved by the current user
          // This can be optimized by fetching all saved post IDs for the user once
          // or by including a saved flag directly from a more complex getPosts query.
          const savedUserPosts = await storage.getPosts(currentUserId, "saved");
          isSaved = savedUserPosts.some(savedPost => savedPost.id === post.id);
        }
        
        return {
          ...post,
          author: author,
          category: {
            name: category?.name || "Unknown",
            color: category?.color || "gray"
          },
          discussCount: participants.length,
          participants: participants.map(p => ({
            id: p.id,
            initials: p.initials,
            colorClass: getColorClass(p.specialty)
          })),
          saved: isSaved
        };
      }));
      
      res.json(postsWithData);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Create post
  app.post("/api/posts", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // User is authenticated and authorized by middleware
      if (!req.user) { // Should be caught by authenticateJWT, but as a safeguard
        return res.status(401).json({ message: "User not authenticated for post creation." });
      }
      
      // Validate request body
      // authorId will be set by the backend using req.user.id
      const { authorId, ...postDataFromClient } = req.body; // Exclude authorId if sent by client
      const parsedData = insertPostSchema.omit({ authorId: true }).safeParse({
        title: postDataFromClient.title,
        content: postDataFromClient.content,
        categoryId: parseInt(postDataFromClient.categoryId),
        timeAgo: "Just now", // This should ideally be set by backend or be a timestamp
        createdAt: new Date(), // Should be handled by DB default
        updatedAt: new Date()  // Should be handled by DB default
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      
      const post = await storage.createPost(parsedData.data, req.user.id);
      res.status(201).json(post);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Save/unsave post
  app.post("/api/posts/:id/save", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const saved = req.body.saved; // Should be boolean
      
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      await storage.savePost(req.user.id, postId, saved);
      res.json({ success: true });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // --- LIKE ROUTES ---
  app.post("/api/posts/:postId/like", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "User not authenticated" });

      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) return res.status(400).json({ message: "Invalid post ID" });

      const userId = req.user.id;

      // Attempt to create a like. If it already exists, delete it (toggle behavior).
      const likeResult = await storage.createLike(postId, userId);

      if (likeResult.alreadyExists) {
        await storage.deleteLike(postId, userId);
        // Fetch current likes count (optional, or client can manage this)
        const likes = await storage.getLikesForPost(postId);
        return res.json({ message: "Post unliked successfully.", liked: false, likesCount: likes.length });
      } else if (likeResult.error) {
        return res.status(500).json({ message: likeResult.error });
      }

      const likes = await storage.getLikesForPost(postId);
      res.json({ message: "Post liked successfully.", liked: true, like: likeResult, likesCount: likes.length });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // --- COMMENT ROUTES ---
  app.get("/api/posts/:postId/comments", async (req: AuthenticatedRequest, res: Response) => { // Can be public or JWT authenticated
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) return res.status(400).json({ message: "Invalid post ID" });

      const comments = await storage.getCommentsForPost(postId);
      // Optionally, transform comments here to include user details if not done in storage
      res.json(comments);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  app.post("/api/posts/:postId/comments", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: "User not authenticated" });

      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) return res.status(400).json({ message: "Invalid post ID" });

      const validationResult = createCommentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid comment data.", errors: validationResult.error.flatten() });
      }
      const { content, parentId } = validationResult.data;

      const comment = await storage.createComment(postId, req.user.id, content, parentId ?? undefined); // Ensure parentId is passed as undefined if null/omitted
      // Optionally, fetch the created comment with user details to return
      const newCommentWithDetails = await storage.getCommentById(comment.id);
      res.status(201).json(newCommentWithDetails || comment);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      
      // Transform for frontend select
      const transformed = categories.map(cat => ({
        value: cat.id.toString(),
        label: cat.name,
        color: cat.color
      }));
      
      res.json(transformed);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get documents
  app.get("/api/documents", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      const searchTerm = req.query.searchTerm as string | undefined;
      const currentUserId = req.user?.id; // Optional user ID for filtering
      
      const documents = await storage.getDocuments(currentUserId, filter, searchTerm);
      
      // Transform data for frontend
      const docsWithSharing = await Promise.all(documents.map(async doc => {
        const sharedUsers = await storage.getDocumentSharedUsers(doc.id);
        
        // Map file type to icon and color
        const fileTypeMap: Record<string, { icon: string, color: string }> = {
          "PDF": { icon: "description", color: "primary" },
          "Excel": { icon: "insert_chart", color: "green-600" },
          "PPT": { icon: "slideshow", color: "blue-500" }
        };
        
        const fileInfo = fileTypeMap[doc.fileType] || { icon: "description", color: "gray-500" };
        
        return {
          ...doc,
          icon: fileInfo.icon,
          typeLabel: {
            name: doc.fileType,
            color: fileInfo.color
          },
          sharedWith: sharedUsers.map(user => ({
            id: user.id,
            initials: user.initials,
            colorClass: getColorClass(user.specialty)
          }))
        };
      }));
      
      res.json(docsWithSharing);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get recent documents
  app.get("/api/documents/recent", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // For "recent", currentUserId might not be strictly necessary unless recency is per-user.
      // Assuming public recency for now. If it's per user, pass req.user.id.
      const documents = await storage.getDocuments(undefined); // Pass undefined for currentUserId if not needed
      
      // Sort by updatedAt and take latest 3
      const recentDocs = documents
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);
      
      // Transform data for frontend
      const docsWithSharing = await Promise.all(recentDocs.map(async doc => {
        const sharedUsers = await storage.getDocumentSharedUsers(doc.id);
        
        // Map file type to icon and color
        const fileTypeMap: Record<string, { icon: string, color: string }> = {
          "PDF": { icon: "description", color: "primary" },
          "Excel": { icon: "insert_chart", color: "green-600" },
          "PPT": { icon: "slideshow", color: "blue-500" }
        };
        
        const fileInfo = fileTypeMap[doc.fileType] || { icon: "description", color: "gray-500" };
        
        return {
          ...doc,
          icon: fileInfo.icon,
          typeLabel: {
            name: doc.fileType,
            color: fileInfo.color
          },
          sharedWith: sharedUsers.map(user => ({
            id: user.id,
            initials: user.initials,
            colorClass: getColorClass(user.specialty)
          }))
        };
      }));
      
      res.json(docsWithSharing);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Upload document
  app.post("/api/documents/upload", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      if (!req.user) { // Should be caught by authenticateJWT
        return res.status(401).json({ message: "User not authenticated for document upload." });
      }
      
      // Get file type from extension
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let fileType = "Unknown";
      
      if ([".pdf"].includes(fileExtension)) {
        fileType = "PDF";
      } else if ([".xls", ".xlsx"].includes(fileExtension)) {
        fileType = "Excel";
      } else if ([".ppt", ".pptx"].includes(fileExtension)) {
        fileType = "PPT";
      } else if ([".doc", ".docx"].includes(fileExtension)) {
        fileType = "Word";
      }
      
      // Validate document data
      // ownerId will be set by the backend using req.user.id
      const { ownerId, ...docDataFromClient } = req.body; // Exclude ownerId if sent
      const parsedData = insertDocumentSchema.omit({ ownerId: true }).safeParse({
        filename: file.originalname, // filename comes from multer's file object
        fileType,                   // fileType determined from extension
        // ownerId: req.user.id,    // This will be passed as separate arg to storage.createDocument
        timeAgo: "Just now",        // Ideally set by backend or use timestamp
        createdAt: new Date(),      // Should be DB default
        updatedAt: new Date()       // Should be DB default
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      // Pass data from parsedData.data, but ensure it aligns with Omit<InsertDocument, 'ownerId'>
      // This might mean constructing the object explicitly if parsedData.data includes more than expected
      const documentToCreate = {
        filename: file.originalname,
        fileType,
        timeAgo: parsedData.data.timeAgo,
        // any other fields from InsertDocument that are not ownerId, createdAt, or updatedAt if handled by DB
      };
      
      const document = await storage.createDocument(documentToCreate, req.user.id);
      res.status(201).json(document);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Share document
  app.post("/api/documents/:id/share", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const userIds: number[] = req.body.userIds;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "UserIds array is required" });
      }
      
      await storage.shareDocument(documentId, userIds);
      res.json({ success: true });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Download document
  app.get("/api/documents/:id/download", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // In a real app, we would retrieve the file from storage and send it
      // For this demo, we'll create a sample file
      const sampleContent = `This is a sample ${document.fileType} file for ${document.filename}`;
      const tempFilePath = path.join(uploadDir, `sample-${documentId}.txt`);
      
      fs.writeFileSync(tempFilePath, sampleContent);
      
      res.download(tempFilePath, document.filename, (err) => {
        // Clean up the temp file after download
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      });
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get upcoming events
  app.get("/api/events/upcoming", async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      
      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Transform data for frontend
      const eventsTransformed = await Promise.all(events.map(async event => {
        const eventType = await storage.getEventType(event.eventTypeId);
        
        // Format date for display
        const date = new Date(event.date);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        
        return {
          ...event,
          attendeeCount: Math.floor(Math.random() * 50) + 5, // In real app, get actual attendees
          eventType: {
            name: eventType?.name || "Event",
            color: eventType?.color || "primary"
          },
          dateFormatted: {
            month: monthNames[date.getMonth()],
            day: date.getDate().toString()
          }
        };
      }));
      
      res.json(eventsTransformed);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get all users (example of a protected route, though typically you might not protect a generic user list this way without pagination/filtering)
  app.get("/api/users", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      // Filter out password before sending
      const usersToReturn = users.map(u => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json(usersToReturn);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });

  // --- PRESCRIPTION ROUTE ---
  app.post("/api/prescription/generate", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
    console.log("POST /api/prescription/generate hit. Body:", req.body);
    try {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="prescription.pdf"');

      const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'portrait' });

      // Helper function to draw section titles
      const drawSectionTitle = (title: string) => {
        doc.font('Helvetica-Bold').fontSize(14).text(title, { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);
      };

      // Helper function to draw a line separator
      const drawLineSeparator = (yOffset = doc.y + 10) => {
        doc.save();
        doc.moveTo(doc.page.margins.left, yOffset)
           .lineTo(doc.page.width - doc.page.margins.right, yOffset)
           .lineWidth(0.5)
           .strokeColor('#cccccc')
           .stroke();
        doc.restore();
        doc.moveDown(1); // Add some space after the line
      };

      // Format date nicely (DD/MM/YYYY)
      const formatDate = (date: Date) => {
        const d = new Date(date);
        let day = d.getDate().toString().padStart(2, '0');
        let month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // --- Header Section ---
      doc.font('Helvetica-Bold').fontSize(20).text("MedLink HealthCare", { align: 'center' });
      doc.font('Helvetica').fontSize(10).text("123 Wellness Avenue, Pune, MH 411001", { align: 'center' });
      doc.text("Contact: +91 9876543210 | Email: medlink@clinicmail.com", { align: 'center' });
      doc.moveDown(1);
      drawLineSeparator(doc.y + 5);
      doc.moveDown(1);

      const doctorName = req.user?.name || "Dr. Default"; // Fallback if req.user.name is not available
      const doctorSpecialty = "General Physician"; // Static as per prompt
      const doctorRegNo = "MH-145263"; // Static as per prompt

      doc.font('Helvetica-Bold').fontSize(12).text(`Dr. ${doctorName}, MD (${doctorSpecialty})`);
      doc.font('Helvetica').fontSize(10).text(`Reg. No: ${doctorRegNo}`);
      doc.text(`Date: ${formatDate(new Date())}`);
      doc.moveDown(1.5);

      // --- Patient Information Section ---
      drawSectionTitle("Patient Information");
      doc.text(`Name: ${req.body.patientName || 'N/A'}`);
      doc.text(`Age / Gender: ${req.body.patientAgeGender || 'N/A'}`);
      doc.text(`Address: ${req.body.patientAddress || 'N/A'}`);
      doc.text(`Contact: ${req.body.patientContact || 'N/A'}`);
      doc.moveDown(1.5);
      drawLineSeparator(doc.y + 5);


      // --- Diagnosis / Symptoms Section ---
      drawSectionTitle("Diagnosis / Symptoms");
      doc.text(`Symptoms/Chief Complaints: ${req.body.symptoms || 'N/A'}`);
      doc.text(`Preliminary Diagnosis: ${req.body.diagnosis || 'N/A'}`);
      doc.moveDown(1.5);
      drawLineSeparator(doc.y + 5);

      // --- Prescription Table (Rx) ---
      drawSectionTitle("Rx (Prescription)");
      const tableTopY = doc.y;
      const medicinesData = req.body.medicines && Array.isArray(req.body.medicines) && req.body.medicines.length > 0
        ? req.body.medicines
        : [
            { medicineName: "Paracetamol 500mg", dosage: "1 tab", frequency: "1-1-1 (TDS)", duration: "5 Days", specialInstructions: "After food" },
            { medicineName: "Cough Syrup XYZ", dosage: "2 tsp (10ml)", frequency: "0-0-1 (HS)", duration: "3 days", specialInstructions: "Shake well before use. May cause drowsiness." },
            { medicineName: "Multivitamin ABC", dosage: "1 capsule", frequency: "1-0-0 (OD)", duration: "30 Days", specialInstructions: "After breakfast" }
          ];

      const drawRxTable = (data: any[], startY: number) => {
        let y = startY;
        const rowHeight = 25; // Approximate row height, can be dynamic
        const leftMargin = doc.page.margins.left;
        const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        const colWidths = {
          medicineName: tableWidth * 0.30,
          dosage: tableWidth * 0.15,
          frequency: tableWidth * 0.15,
          duration: tableWidth * 0.15,
          specialInstructions: tableWidth * 0.25
        };

        const headers = ["Medicine Name", "Dosage", "Frequency", "Duration", "Instructions"];
        const colKeys = ["medicineName", "dosage", "frequency", "duration", "specialInstructions"];

        // Draw Table Header
        doc.font('Helvetica-Bold').fontSize(9);
        let currentX = leftMargin;
        headers.forEach((header, i) => {
          const key = colKeys[i] as keyof typeof colWidths;
          doc.text(header, currentX + 5, y + 5, { width: colWidths[key] - 10, align: 'left' });
          doc.rect(currentX, y, colWidths[key], rowHeight).stroke();
          currentX += colWidths[key];
        });
        y += rowHeight;

        // Draw Table Rows
        doc.font('Helvetica').fontSize(9);
        data.forEach(row => {
          currentX = leftMargin;
          let maxHeightInRow = rowHeight; // Default height

          // Calculate max height needed for this row (for text wrapping)
          // This is a simplified approach; true dynamic height is complex with pdfkit's streaming nature
          colKeys.forEach(key => {
            const text = row[key] || '';
            const colWidth = colWidths[key as keyof typeof colWidths];
            const textHeight = doc.heightOfString(text, { width: colWidth - 10 });
            if (textHeight > maxHeightInRow) maxHeightInRow = textHeight + 10; // Add padding
          });
          if (maxHeightInRow < rowHeight) maxHeightInRow = rowHeight;


          // Check for page overflow BEFORE drawing the row
          if (y + maxHeightInRow > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.page.margins.top;
            // Redraw headers on new page
            doc.font('Helvetica-Bold').fontSize(9);
            currentX = leftMargin;
            headers.forEach((header, i) => {
                const key = colKeys[i] as keyof typeof colWidths;
                doc.text(header, currentX + 5, y + 5, { width: colWidths[key] - 10, align: 'left' });
                doc.rect(currentX, y, colWidths[key], rowHeight).stroke();
                currentX += colWidths[key];
            });
            y += rowHeight;
            doc.font('Helvetica').fontSize(9); // Switch back to regular font for content
          }


          currentX = leftMargin;
          colKeys.forEach(key => {
            const text = row[key as keyof typeof row] || 'N/A';
            doc.text(text, currentX + 5, y + 5, { width: colWidths[key as keyof typeof colWidths] - 10, align: 'left' });
            doc.rect(currentX, y, colWidths[key as keyof typeof colWidths], maxHeightInRow).stroke();
            currentX += colWidths[key as keyof typeof colWidths];
          });
          y += maxHeightInRow;
        });
        doc.y = y; // Update global Y position
      };

      drawRxTable(medicinesData, tableTopY);
      doc.moveDown(1.5);
      drawLineSeparator(doc.y + 5);

      // --- Additional Notes Section ---
      drawSectionTitle("Additional Notes");
      doc.text(`Diet Advice / Lifestyle Notes: ${req.body.dietAdvice || 'None'}`);
      doc.text(`Next Visit Date: ${req.body.nextVisitDate || 'As needed'}`);
      doc.moveDown(1.5);

      // --- Footer Section ---
      // Position footer at the bottom. This is an approximation.
      // For a true sticky footer, complex calculations or direct Y positioning on last page is needed.
      const footerY = doc.page.height - doc.page.margins.bottom - 60; // Adjust 60 as needed

      // Check if there's enough space for footer, otherwise add new page
      // This is a simple check, might need refinement for multi-page docs
      if (doc.y > footerY - 20) { // If current y is too close to where footer should start
         // doc.addPage(); // This might be too aggressive if content just slightly overruns
         // For now, let it draw where it is, or slightly lower.
      }
      doc.y = Math.max(doc.y, footerY - 50); // Ensure footer doesn't overlap content too much

      drawLineSeparator(doc.y + 10);
      doc.moveDown(2);

      const signatureX = doc.page.width - doc.page.margins.right - 200;
      doc.font('Helvetica').fontSize(10).text("Doctor's Signature", signatureX, doc.y, { width: 180, align: 'right' });
      doc.moveTo(signatureX - 20, doc.y - 5).lineTo(doc.page.width - doc.page.margins.right, doc.y - 5).stroke(); // Line for signature
      doc.moveDown(2);

      doc.fontSize(8).text("This is a digital prescription. Valid for pharmacy use.", doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 10, { align: 'center' });

      doc.pipe(res);
      doc.end();

    } catch (err) {
      console.error("Error generating PDF:", err);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'inline');
        res.status(500).send("Error generating PDF.");
      } else {
        // If headers already sent, just end the response, error is logged
        res.end();
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to get color class based on specialty
function getColorClass(specialty: string): string {
  const colorMap: Record<string, string> = {
    "Cardiology": "bg-primary/20 text-primary",
    "Neurology": "bg-secondary/20 text-secondary",
    "Infectious Disease": "bg-green-100 text-green-600",
    "Pulmonology": "bg-accent/20 text-accent/80"
  };
  
  return colorMap[specialty] || "bg-gray-200 text-gray-600";
}

// --- DASHBOARD ROUTES ---
// Part 1: Doctor Dashboard APIs
app.get("/api/dashboard/doctor/student-connection-requests", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });
    const doctorId = req.user.id;

    // Fetch pending connections where the current doctor is the recipient
    const pendingConnections = await storage.getConnectionsForUser(doctorId, 'pending');

    // Filter for requests initiated by students
    // The `getConnectionsForUser` should populate `user` (initiator) and `connectedUser` (recipient)
    const studentRequests = pendingConnections.filter(conn =>
      conn.userId !== doctorId && // Ensure the doctor is the recipient (connectedUserId)
      conn.user?.role === UserRole.enum.Student
    );

    res.json(studentRequests);
  } catch (err) {
    handleErrors(err as Error, res);
  }
});

app.get("/api/dashboard/doctor/appointments", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
  // Placeholder for Doctor's appointments
  res.json({ message: "Appointments endpoint for Doctors - to be implemented", appointments: [] });
});

app.get("/api/dashboard/doctor/messages", authenticateJWT, authorizeRoles(UserRole.enum.Doctor), async (req: AuthenticatedRequest, res: Response) => {
  // Placeholder for Doctor's messages
  res.json({ message: "Messages endpoint for Doctors - to be implemented", messages: [] });
});
