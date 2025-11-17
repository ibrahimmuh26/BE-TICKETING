import {
  getRoles,
  getRoleById,
  getRoleByName,
  createRole,
  deleteRoleById,
  updateRoleById,
} from '../../models/Role';
import RoleModel from '../../models/Role';

describe('Role Model', () => {
  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        name: 'L1',
        permissions: ['read'],
        description: 'L1 role for testing',
      };

      const role = new RoleModel(roleData);
      await role.save();

      expect(role).toBeDefined();
      expect(role.name).toBe('L1');
      expect(role.permissions).toEqual(['read']);
      expect(role.description).toBe('L1 role for testing');
    });

    it('should fail when creating role with duplicate name', async () => {
      const roleData = {
        name: 'L1',
        permissions: ['read'],
        description: 'First L1 role',
      };

      const role1 = new RoleModel(roleData);
      await role1.save();

      // Try to create another role with same name
      const duplicateRole = new RoleModel({
        name: 'L1',
        permissions: ['read', 'write'],
        description: 'Duplicate L1 role',
      });

      await expect(duplicateRole.save()).rejects.toThrow();
    });

    it('should only accept L1, L2, or L3 as role names', async () => {
      const invalidRole = new RoleModel({
        name: 'INVALID',
        permissions: ['read'],
      });

      await expect(invalidRole.save()).rejects.toThrow();
    });
  });

  describe('getRoles', () => {
    it('should return all roles', async () => {
      const role1 = new RoleModel({
        name: 'L1',
        permissions: ['read'],
      });
      await role1.save();

      const role2 = new RoleModel({
        name: 'L2',
        permissions: ['read', 'write'],
      });
      await role2.save();

      const roles = await getRoles();

      expect(roles).toBeDefined();
      expect(roles.length).toBe(2);
    });

    it('should return empty array when no roles exist', async () => {
      const roles = await getRoles();
      expect(roles).toEqual([]);
    });
  });

  describe('getRoleById', () => {
    it('should find role by id', async () => {
      const role = new RoleModel({
        name: 'L1',
        permissions: ['read'],
        description: 'Test role',
      });
      await role.save();

      const foundRole = await getRoleById(role._id.toString());

      expect(foundRole).toBeDefined();
      expect(foundRole?._id.toString()).toBe(role._id.toString());
      expect(foundRole?.name).toBe('L1');
    });

    it('should return null for invalid id', async () => {
      const role = await getRoleById('507f1f77bcf86cd799439011');
      expect(role).toBeNull();
    });
  });

  describe('getRoleByName', () => {
    it('should find role by name', async () => {
      const role = new RoleModel({
        name: 'L2',
        permissions: ['read', 'write'],
        description: 'L2 role',
      });
      await role.save();

      const foundRole = await getRoleByName('L2');

      expect(foundRole).toBeDefined();
      expect(foundRole?.name).toBe('L2');
      expect(foundRole?.permissions).toEqual(['read', 'write']);
    });

    it('should return null for non-existent role name', async () => {
      const role = await getRoleByName('L3');
      expect(role).toBeNull();
    });
  });

  describe('updateRoleById', () => {
    it('should update role successfully', async () => {
      const role = new RoleModel({
        name: 'L1',
        permissions: ['read'],
        description: 'Old description',
      });
      await role.save();

      const updatedRole = await updateRoleById(role._id.toString(), {
        description: 'New description',
        permissions: ['read', 'write'],
      });

      expect(updatedRole).toBeDefined();
      expect(updatedRole?.description).toBe('New description');
      expect(updatedRole?.permissions).toEqual(['read', 'write']);
    });

    it('should return updated role with new: true option', async () => {
      const role = new RoleModel({
        name: 'L1',
        permissions: ['read'],
      });
      await role.save();

      const updatedRole = await updateRoleById(role._id.toString(), {
        permissions: ['read', 'write', 'delete'],
      });

      expect(updatedRole?.permissions).toEqual(['read', 'write', 'delete']);
    });
  });

  describe('deleteRoleById', () => {
    it('should delete role successfully', async () => {
      const role = new RoleModel({
        name: 'L1',
        permissions: ['read'],
      });
      await role.save();

      await deleteRoleById(role._id.toString());

      const deletedRole = await getRoleById(role._id.toString());
      expect(deletedRole).toBeNull();
    });

    it('should return null when deleting non-existent role', async () => {
      const result = await deleteRoleById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });

  describe('Role Schema Validation', () => {
    it('should require name field', async () => {
      const invalidRole = new RoleModel({
        permissions: ['read'],
      });

      await expect(invalidRole.save()).rejects.toThrow();
    });

    it('should allow role without description', async () => {
      const role = new RoleModel({
        name: 'L1',
        permissions: ['read'],
      });

      await expect(role.save()).resolves.toBeDefined();
    });

    it('should store permissions as array', async () => {
      const role = new RoleModel({
        name: 'L3',
        permissions: ['read', 'write', 'delete', 'admin'],
      });
      await role.save();

      expect(Array.isArray(role.permissions)).toBe(true);
      expect(role.permissions.length).toBe(4);
    });
  });
});
