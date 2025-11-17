import RoleModel from '../models/Role';

const roles = [
    {
        name: 'L1',
        permissions: ['read'],
        description: 'Level 1 - Basic Access'
    },
    {
        name: 'L2',
        permissions: ['read', 'write'],
        description: 'Level 2 - Intermediate Access'
    },
    {
        name: 'L3',
        permissions: ['read', 'write', 'delete', 'admin'],
        description: 'Level 3 - Full Access'
    }
];

export const seedRoles = async () => {
    try {
        await RoleModel.deleteMany({});
        const createdRoles = await RoleModel.insertMany(roles);
        console.log(' Roles seeded successfully');
        console.log(`  - Created ${createdRoles.length} roles: L1, L2, L3`);
        return createdRoles;
    } catch (error) {
        console.error(' Error seeding roles:', error);
        throw error;
    }
};
