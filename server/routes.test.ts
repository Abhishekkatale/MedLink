import request from 'supertest';
import express, { Express } from 'express';
import { Server } from 'http';
import { registerRoutes } from './routes'; // Assuming registerRoutes sets up all app routes
import { storage, MemStorage } from './storage'; // Import storage to interact with it
import { UserRole } from '@shared/schema';

let app: Express;
let server: Server;

// Helper to reset storage before each test
const resetStorage = ()_ => {
  // This is a simplified reset. In a real scenario, you might re-initialize MemStorage
  // or have a dedicated reset method.
  (storage as any).usersData.clear();
  (storage as any).userId = 1; // Reset user ID counter
};

beforeAll(async () => {
  app = express();
  app.use(express.json()); // Ensure body parser is used for tests
  server = await registerRoutes(app); // registerRoutes returns the http.Server
});

afterAll((done) => {
  // Reset storage after all tests are done
  resetStorage();
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('Auth Endpoints', () => {
  beforeEach(() => {
    // Reset storage before each test to ensure test isolation
    resetStorage();
  });

  describe('POST /api/auth/signup', () => {
    it('should signup a new user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          password: 'password123',
          role: UserRole.Values.patient,
          name: 'Test User',
          title: 'Patient',
          organization: 'Test Org',
          specialty: 'General',
          location: 'Test City',
          initials: 'TU',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.role).toBe(UserRole.Values.patient);

      const user = await storage.getUserByUsername('testuser');
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
    });

    it('should fail if username already exists', async () => {
      // Pre-create a user
      await storage.createUser({
        username: 'existinguser',
        password: 'password123',
        role: UserRole.Values.patient,
        name: 'Existing User',
        title: 'Patient',
        organization: 'Test Org',
        specialty: 'General',
        location: 'Test City',
        initials: 'EU',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'existinguser',
          password: 'newpassword',
          role: UserRole.Values.admin,
          name: 'New User',
          title: 'Admin',
          organization: 'Test Org',
          specialty: 'Admin',
          location: 'Test City',
          initials: 'NU',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Username already exists.');
    });

    it('should fail if an invalid role is provided', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuserrole',
          password: 'password123',
          role: 'invalid-role', // Invalid role
          name: 'Role User',
          title: 'Tester',
          organization: 'Test Org',
          specialty: 'Testing',
          location: 'Test City',
          initials: 'RU',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid role provided.');
    });
     it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'incompleteuser',
          // password missing
          role: UserRole.Values.patient,
          name: 'Incomplete User'
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Username, password, role, and name are required.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Ensure a user exists to test login
      await storage.createUser({
        username: 'loginuser',
        password: 'password123', // createUser in storage hashes this
        role: UserRole.Values.patient,
        name: 'Login User',
        title: 'Patient',
        organization: 'Test Org',
        specialty: 'General',
        location: 'Test City',
        initials: 'LU',
      });
    });

    it('should login successfully with correct credentials and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123', // Plain text password
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('loginuser');
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should fail with non-existent username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });
  });

  describe('JWT Authentication', () => {
    // Using /api/users/current as the sample protected route
    it('should deny access to a protected route without a token', async () => {
      const res = await request(app).get('/api/users/current');
      expect(res.statusCode).toEqual(401); // Or 403 depending on middleware exact behavior before role check
    });

    it('should deny access with an invalid/expired token', async () => {
      const res = await request(app)
        .get('/api/users/current')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toEqual(403); // jwt.verify fails
    });

    it('should allow access with a valid token', async () => {
      // 1. Signup/Login to get a token
      const loginRes = await request(app)
        .post('/api/auth/signup') // Using signup to ensure user exists and get token
        .send({
          username: 'authtestuser',
          password: 'password123',
          role: UserRole.Values.patient,
          name: 'Auth Test User',
          title: 'Patient',
          organization: 'Test Org',
          specialty: 'General',
          location: 'Test City',
          initials: 'ATU',
        });
      const token = loginRes.body.token;
      expect(token).toBeDefined();

      // 2. Use token to access protected route
      const res = await request(app)
        .get('/api/users/current')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toBe('authtestuser');
    });
  });
});


describe('RBAC (Role-Based Access Control)', () => {
  let patientToken: string;
  let adminToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    // Clear and create users with specific roles to get their tokens
    resetStorage();
    const patientRes = await request(app).post('/api/auth/signup').send({
      username: 'patientrbac', password: 'password', role: UserRole.Values.patient, name: 'Patient RBAC', title: 'P', organization: 'O', specialty: 'S', location: 'L', initials: 'PR'
    });
    patientToken = patientRes.body.token;

    const adminRes = await request(app).post('/api/auth/signup').send({
      username: 'adminrbac', password: 'password', role: UserRole.Values.admin, name: 'Admin RBAC', title: 'A', organization: 'O', specialty: 'S', location: 'L', initials: 'AR'
    });
    adminToken = adminRes.body.token;

    const superAdminRes = await request(app).post('/api/auth/signup').send({
        username: 'superadminrbac', password: 'password', role: UserRole.Values.superadmin, name: 'SuperAdmin RBAC', title: 'SA', organization: 'O', specialty: 'S', location: 'L', initials: 'SR'
    });
    superAdminToken = superAdminRes.body.token;

    expect(patientToken).toBeDefined();
    expect(adminToken).toBeDefined();
    expect(superAdminToken).toBeDefined();
  });

  beforeEach(() => {
    // No need to reset storage here as users are created in beforeAll for RBAC tests
  });

  // Test POST /api/posts (requires admin or superadmin)
  describe('POST /api/posts', () => {
    const postData = { title: 'Test Post', content: 'Test Content', categoryId: 1 };

    it('should allow admin to create a post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(postData);
      expect(res.statusCode).toEqual(201); // Or 200 if that's what your API returns
    });

    it('should allow superadmin to create a post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(postData);
      expect(res.statusCode).toEqual(201);
    });

    it('should deny patient from creating a post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(postData);
      expect(res.statusCode).toEqual(403); // Forbidden
    });

    it('should deny unauthenticated user from creating a post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send(postData);
      expect(res.statusCode).toEqual(401); // Unauthorized
    });
  });

  // Test POST /api/documents/upload (requires admin or superadmin)
  describe('POST /api/documents/upload', () => {
    // Supertest .attach() is used for file uploads
    it('should allow admin to upload a document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');
      expect(res.statusCode).toEqual(201);
    });

    it('should allow superadmin to upload a document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');
      expect(res.statusCode).toEqual(201);
    });

    it('should deny patient from uploading a document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt');
      expect(res.statusCode).toEqual(403);
    });

    it('should deny unauthenticated user from uploading a document', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .attach('file', Buffer.from('test file content'), 'test.txt');
      expect(res.statusCode).toEqual(401);
    });
  });

  // Test GET /api/users (requires admin or superadmin)
  describe('GET /api/users', () => {
     it('should allow admin to get users list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow superadmin to get users list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny patient from getting users list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should deny unauthenticated from getting users list', async () => {
      const res = await request(app)
        .get('/api/users');
      expect(res.statusCode).toEqual(401);
    });
  });
});
