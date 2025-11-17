import express from 'express';
import { getUsersWithRole, getUserById, updateUserById } from '../models/User';
import { getRoleByName } from '../models/Role';

export const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
        const users = await getUsersWithRole();
        return res.status(200).json(users).end();
    } catch (err) {
        console.log('Get All Users Error:', err);
        return res.sendStatus(400);
    }
}

export const updateUserRole = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { roleName } = req.body;

        if (!roleName) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        if (!['L1', 'L2', 'L3'].includes(roleName)) {
            return res.status(400).json({ message: 'Invalid role. Must be L1, L2, or L3' });
        }

        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role = await getRoleByName(roleName);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        const updatedUser = await updateUserById(id, { roleId: role._id });

        return res.status(200).json({
            message: 'User role updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: roleName
            }
        });
    } catch (err) {
        console.log('Update User Role Error:', err);
        return res.status(400).json({ message: 'Failed to update user role' });
    }
}
