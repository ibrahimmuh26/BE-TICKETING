import {
  getUsers,
  getUsersWithRole,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  createUser,
  deleteUserById,
  updateUserById,
  getUsersByRoleName,
  getUsersByRoleId,
} from '../../models/User';
import { createTestRole } from '../utils/testHelpers';
import { hashPassword } from '../../helpers/password';

describe('User Model', () => {
  let testRoleId: string;

  beforeEach(async () => {
    const role = await createTestRole('L1');
    testRoleId = role._id.toString();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      };

      const user = await createUser(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.roleId.toString()).toBe(testRoleId);
    });

    it('should fail when creating user with duplicate email', async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      };

      await createUser(userData);

      // Try to create another user with same email
      const duplicateData = {
        username: 'testuser2',
        email: 'duplicate@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      };

      await expect(createUser(duplicateData)).rejects.toThrow();
    });

    it('should fail when creating user with duplicate username', async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'duplicateuser',
        email: 'user1@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      };

      await createUser(userData);

      // Try to create another user with same username
      const duplicateData = {
        username: 'duplicateuser',
        email: 'user2@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      };

      await expect(createUser(duplicateData)).rejects.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      const hashedPassword = await hashPassword('password123');
      await createUser({
        username: 'testuser',
        email: 'findme@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      });

      const user = await getUserByEmail('findme@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('findme@example.com');
      expect(user?.username).toBe('testuser');
    });

    it('should return null for non-existent email', async () => {
      const user = await getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should find user by username', async () => {
      const hashedPassword = await hashPassword('password123');
      await createUser({
        username: 'findmeuser',
        email: 'user@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      });

      const user = await getUserByUsername('findmeuser');

      expect(user).toBeDefined();
      expect(user?.username).toBe('findmeuser');
      expect(user?.email).toBe('user@example.com');
    });

    it('should return null for non-existent username', async () => {
      const user = await getUserByUsername('nonexistentuser');
      expect(user).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should find user by id', async () => {
      const hashedPassword = await hashPassword('password123');
      const createdUser = await createUser({
        username: 'testuser',
        email: 'test@example.com',
        roleId: testRoleId,
        authentication: {
          password: hashedPassword,
        },
      });

      const user = await getUserById(createdUser._id.toString());

      expect(user).toBeDefined();
      expect(user?._id.toString()).toBe(createdUser._id.toString());
      expect(user?.username).toBe('testuser');
    });

    it('should return null for invalid id', async () => {
      const user = await getUserById('507f1f77bcf86cd799439011');
      expect(user).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const hashedPassword = await hashPassword('password123');

      await createUser({
        username: 'user1',
        email: 'user1@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      await createUser({
        username: 'user2',
        email: 'user2@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      const users = await getUsers();

      expect(users).toBeDefined();
      expect(users.length).toBe(2);
    });

    it('should return empty array when no users exist', async () => {
      const users = await getUsers();
      expect(users).toEqual([]);
    });
  });

  describe('getUsersWithRole', () => {
    it('should return users with populated role', async () => {
      const hashedPassword = await hashPassword('password123');

      await createUser({
        username: 'user1',
        email: 'user1@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      const users = await getUsersWithRole();

      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      expect(users[0].roleId).toBeDefined();
    });
  });

  describe('updateUserById', () => {
    it('should update user successfully', async () => {
      const hashedPassword = await hashPassword('password123');
      const user = await createUser({
        username: 'oldusername',
        email: 'old@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      await updateUserById(user._id.toString(), {
        username: 'newusername',
      });

      const updatedUser = await getUserById(user._id.toString());

      expect(updatedUser?.username).toBe('newusername');
    });
  });

  describe('deleteUserById', () => {
    it('should delete user successfully', async () => {
      const hashedPassword = await hashPassword('password123');
      const user = await createUser({
        username: 'deleteMe',
        email: 'delete@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      await deleteUserById(user._id.toString());

      const deletedUser = await getUserById(user._id.toString());
      expect(deletedUser).toBeNull();
    });

    it('should return null when deleting non-existent user', async () => {
      const result = await deleteUserById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });

  describe('getUsersByRoleName', () => {
    it('should return users with specific role name', async () => {
      const hashedPassword = await hashPassword('password123');
      const l2Role = await createTestRole('L2');

      await createUser({
        username: 'l1user',
        email: 'l1@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      await createUser({
        username: 'l2user',
        email: 'l2@example.com',
        roleId: l2Role._id.toString(),
        authentication: { password: hashedPassword },
      });

      const l1Users = await getUsersByRoleName('L1');

      expect(l1Users.length).toBe(1);
      expect(l1Users[0].username).toBe('l1user');
    });

    it('should return empty array for non-existent role', async () => {
      const users = await getUsersByRoleName('NonExistentRole');
      expect(users).toEqual([]);
    });
  });

  describe('getUsersByRoleId', () => {
    it('should return users with specific role id', async () => {
      const hashedPassword = await hashPassword('password123');

      await createUser({
        username: 'user1',
        email: 'user1@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      await createUser({
        username: 'user2',
        email: 'user2@example.com',
        roleId: testRoleId,
        authentication: { password: hashedPassword },
      });

      const users = await getUsersByRoleId(testRoleId);

      expect(users.length).toBe(2);
    });
  });
});
