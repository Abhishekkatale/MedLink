import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { insertPostSchema, insertDocumentSchema, insertConnectionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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

  // Current user endpoint
  app.get("/api/users/current", async (req: Request, res: Response) => {
    try {
      const user = await storage.getCurrentUser();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get user colleagues
  app.get("/api/users/colleagues", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const colleagues = await storage.getUserColleagues(currentUser.id);
      
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
  app.get("/api/users/suggestions", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const suggestions = await storage.getUserSuggestions(currentUser.id);
      
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
  app.get("/api/users/profile", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getProfile(currentUser.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Combine user and profile data
      const userProfile = {
        ...profile,
        name: currentUser.name,
        title: currentUser.title,
        organization: currentUser.organization,
        initials: currentUser.initials
      };
      
      res.json(userProfile);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get connection requests
  app.get("/api/users/connection-requests", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const requests = await storage.getConnectionRequests(currentUser.id);
      res.json(requests);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Create connection
  app.post("/api/connections/connect", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const parsedData = insertConnectionSchema.safeParse({
        userId: currentUser.id,
        connectedUserId: req.body.userId,
        status: "pending"
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      
      const connection = await storage.createConnection(
        currentUser.id,
        req.body.userId
      );
      
      res.status(201).json(connection);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get users directory
  app.get("/api/users/directory", async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.searchTerm as string | undefined;
      const specialtyFilter = req.query.specialtyFilter as string | undefined;
      const showConnected = req.query.showConnected === "true";
      
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all users or filtered by specialty
      let users;
      if (specialtyFilter && specialtyFilter !== "all") {
        users = await storage.getUsersBySpecialty(specialtyFilter);
      } else {
        users = await storage.getUsers();
      }
      
      // Filter out current user
      users = users.filter(user => user.id !== currentUser.id);
      
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
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stats = await storage.getStats(currentUser.id);
      res.json(stats);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Get posts
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      const searchTerm = req.query.searchTerm as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      
      const posts = await storage.getPosts(filter, searchTerm, categoryId);
      
      // Get full post data with author and participants
      const postsWithData = await Promise.all(posts.map(async post => {
        const author = await storage.getUser(post.authorId);
        const category = await storage.getCategory(post.categoryId);
        const participants = await storage.getPostParticipants(post.id);
        
        // Check if current user has saved this post
        const currentUser = await storage.getCurrentUser();
        const savedPosts = Array.from(await storage.getPosts("saved"));
        const isSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        
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
  app.post("/api/posts", async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body
      const parsedData = insertPostSchema.safeParse({
        title: req.body.title,
        content: req.body.content,
        authorId: currentUser.id,
        categoryId: parseInt(req.body.categoryId),
        timeAgo: "Just now",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      
      const post = await storage.createPost(parsedData.data);
      res.status(201).json(post);
    } catch (err) {
      handleErrors(err as Error, res);
    }
  });
  
  // Save/unsave post
  app.post("/api/posts/:id/save", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const saved = req.body.saved;
      
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.savePost(postId, currentUser.id, saved);
      res.json({ success: true });
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
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string | undefined;
      const searchTerm = req.query.searchTerm as string | undefined;
      
      const documents = await storage.getDocuments(filter, searchTerm);
      
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
  app.get("/api/documents/recent", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocuments();
      
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
  app.post("/api/documents/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const currentUser = await storage.getCurrentUser();
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
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
      const parsedData = insertDocumentSchema.safeParse({
        filename: file.originalname,
        fileType,
        ownerId: currentUser.id,
        timeAgo: "Just now",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (!parsedData.success) {
        throw parsedData.error;
      }
      
      const document = await storage.createDocument(parsedData.data);
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
  
  // Get all users
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      handleErrors(err as Error, res);
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
