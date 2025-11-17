import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedRoles } from './roleSeeder';
import { seedUsers } from './userSeeder';

dotenv.config();

const MONGO_URL = process.env.MONGO_CLOUD_URI || process.env.MONGO_LOCAL_URI || '';

const runSeeder = async () => {
    try {
        const arg = process.argv[2]?.toLowerCase();

        console.log(' Starting database seeding...\n');

        await mongoose.connect(MONGO_URL);
        console.log(' Connected to MongoDB\n');

        // Determine what to seed based on argument
        if (arg === 'roles') {
            await seedRoles();
        } else if (arg === 'users') {
            await seedUsers();
        } else if (!arg || arg === 'all') {
            console.log('Running all seeders...\n');
            await seedRoles();
            console.log('');
            await seedUsers();
        } else {
            console.log('.  Invalid argument. Use: roles, users, or all (default)');
            console.log('\nUsage:');
            console.log('  npm run seed       - Seed all');
            console.log('  npm run seed roles - Seed roles only');
            console.log('  npm run seed users - Seed users only');
            process.exit(1);
        }

        console.log('\n Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n Seeding failed:', error);
        process.exit(1);
    }
};

runSeeder();
