import request from 'supertest';
import express from 'express';
import { register, login, logout } from '../../controller/authentication';
import { createTestRole, createTestUser } from '../utils/testHelpers';
import cookieParser from 'cookie-parser';

// Create a test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.post('/register', register);
app.post('/login', login);
app.post('/logout', logout);

describe('Authentication Controller', () => {
  describe('POST /register', () => {
    beforeEach(async () => {
      // Ensure roles exist
      await createTestRole('L1');
      await createTestRole('L2');
      await createTestRole('L3');
    });

    it('should register a new user successfully with default L1 role', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user.role).toBe('L1');
      expect(response.body.user.id).toBeDefined();
    });

    it('should register a new user with specified role', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'l2user@example.com',
          username: 'l2user',
          password: 'password123',
          roleName: 'L2',
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('L2');
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email, password, and username are required');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email, password, and username are required');
    });

    it('should fail when username is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email, password, and username are required');
    });

    it('should fail when email already exists', async () => {
      await createTestUser('existing@example.com', 'existinguser', 'password123', 'L1');

      const response = await request(app)
        .post('/register')
        .send({
          email: 'existing@example.com',
          username: 'newusername',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should fail when username already exists', async () => {
      await createTestUser('user1@example.com', 'existingusername', 'password123', 'L1');

      const response = await request(app)
        .post('/register')
        .send({
          email: 'user2@example.com',
          username: 'existingusername',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should fail with invalid role name', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          roleName: 'INVALID',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role. Must be L1, L2, or L3');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await createTestRole('L1');
      await createTestUser('logintest@example.com', 'loginuser', 'password123', 'L1');
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('logintest@example.com');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.role).toBe('L1');
      expect(response.body.token).toBeDefined();
    });

    it('should set authentication cookie on successful login', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
        });

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('AUTH=');
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email or Password wrong');
    });

    it('should fail when password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'logintest@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email or Password wrong');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Failed login');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Failed login');
    });

    it('should fail with case-sensitive password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'logintest@example.com',
          password: 'PASSWORD123',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Failed login');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app).post('/logout');

      expect(response.status).toBe(200);
    });

    it('should clear authentication cookie', async () => {
      const response = await request(app).post('/logout');

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('AUTH=;');
    });
  });
});
