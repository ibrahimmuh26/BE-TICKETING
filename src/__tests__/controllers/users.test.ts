import request from 'supertest';
import express from 'express';
import { getAllUsers, updateUserRole } from '../../controller/users';
import { createTestRole, createTestUser } from '../utils/testHelpers';

// Create a test app
const app = express();
app.use(express.json());
app.get('/users', getAllUsers);
app.post('/users/:id/role', updateUserRole);

describe('Users Controller', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create roles
    await createTestRole('L1');
    await createTestRole('L2');
    await createTestRole('L3');

    // Create a test user
    const user = await createTestUser('test@example.com', 'testuser', 'password123', 'L1');
    testUserId = user._id.toString();
  });

  describe('GET /users', () => {
    it('should return all users with their roles', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].email).toBe('test@example.com');
      expect(response.body[0].username).toBe('testuser');
      expect(response.body[0].roleId).toBeDefined();
    });

    it('should return empty array when no users exist', async () => {
      // Delete all users
      const UserModel = (await import('../../models/User')).default;
      await UserModel.deleteMany({});

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return multiple users', async () => {
      await createTestUser('user2@example.com', 'user2', 'password123', 'L2');
      await createTestUser('user3@example.com', 'user3', 'password123', 'L3');

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    });
  });

  describe('POST /users/:id/role', () => {
    it('should update user role successfully', async () => {
      const response = await request(app)
        .post(`/users/${testUserId}/role`)
        .send({
          roleName: 'L2',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User role updated successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('L2');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should update user role from L1 to L3', async () => {
      const response = await request(app)
        .post(`/users/${testUserId}/role`)
        .send({
          roleName: 'L3',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('L3');
    });

    it('should fail when roleName is missing', async () => {
      const response = await request(app)
        .post(`/users/${testUserId}/role`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Role name is required');
    });

    it('should fail with invalid role name', async () => {
      const response = await request(app)
        .post(`/users/${testUserId}/role`)
        .send({
          roleName: 'INVALID',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid role. Must be L1, L2, or L3');
    });

    it('should fail when user not found', async () => {
      const response = await request(app)
        .post('/users/507f1f77bcf86cd799439011/role')
        .send({
          roleName: 'L2',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should fail with invalid user ID format', async () => {
      const response = await request(app)
        .post('/users/invalid-id/role')
        .send({
          roleName: 'L2',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Failed to update user role');
    });
  });
});
