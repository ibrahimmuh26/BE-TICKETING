import UserModel from '../models/User';
import RoleModel from '../models/Role';
import { hashPassword } from '../helpers/password';

const users = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        roleName: 'L3'
    },
    {
        username: 'user1',
        email: 'user1@example.com',
        password: 'user123',
        roleName: 'L2'
    },
    {
        username: 'user2',
        email: 'user2@example.com',
        password: 'user123',
        roleName: 'L1'
    },
    {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'L2'
    },
    {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        roleName: 'L1'
    }
];

export const seedUsers = async () => {
    try {
        // Get all roles first
        const roles = await RoleModel.find();

        if (roles.length === 0) {
            console.log('  No roles found. Please run: npm run seed roles');
            throw new Error('Roles must be seeded first');
        }

        await UserModel.deleteMany({});

        const usersWithAuth = await Promise.all(users.map(async user => {
            const role = roles.find(r => r.name === user.roleName);

            if (!role) {
                throw new Error(`Role ${user.roleName} not found`);
            }

            const hashedPassword = await hashPassword(user.password);

            return {
                username: user.username,
                email: user.email,
                roleId: role._id,
                authentication: {
                    password: hashedPassword
                }
            };
        }));

        await UserModel.insertMany(usersWithAuth);
        console.log(' Users seeded successfully');
        console.log(`  - Created ${users.length} users`);
        console.log('\n Credentials:');
        users.forEach(user => {
            console.log(`   - ${user.email} / ${user.password} (${user.roleName})`);
        });
    } catch (error) {
        console.error(' Error seeding users:', error);
        throw error;
    }
};
