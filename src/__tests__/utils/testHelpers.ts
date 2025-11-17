import { createRole, getRoleByName } from '../../models/Role';
import { createUser } from '../../models/User';
import { hashPassword } from '../../helpers/password';
import { generateToken } from '../../helpers/jwt';

export const createTestRole = async (name: 'L1' | 'L2' | 'L3') => {
  const permissions: Record<string, string[]> = {
    L1: ['read'],
    L2: ['read', 'write'],
    L3: ['read', 'write', 'delete', 'admin'],
  };

  return await createRole({
    name,
    permissions: permissions[name],
    description: `${name} role for testing`,
  });
};

export const createTestUser = async (
  email: string,
  username: string,
  password: string,
  roleName: 'L1' | 'L2' | 'L3' = 'L1'
) => {
  // Ensure role exists
  let role = await getRoleByName(roleName);
  if (!role) {
    role = await createTestRole(roleName);
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    email,
    username,
    roleId: role._id,
    authentication: {
      password: hashedPassword,
    },
  });

  return user;
};

export const generateTestToken = (userId: string, email: string, role: string) => {
  return generateToken({ userId, email, role });
};

export const createAuthenticatedUser = async (
  email: string = 'test@example.com',
  username: string = 'testuser',
  password: string = 'password123',
  roleName: 'L1' | 'L2' | 'L3' = 'L1'
) => {
  const user = await createTestUser(email, username, password, roleName);
  const token = generateTestToken(user._id.toString(), user.email, roleName);

  return { user, token };
};
