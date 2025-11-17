import express from 'express';

import { getUserByEmail, getUserByUsername, createUser } from '../models/User';
import { getRoleByName } from '../models/Role';
import { hashPassword, comparePassword } from '../helpers/password';
import { generateToken } from '../helpers/jwt';  

export const register = async (req: express.Request,res:express.Response)=>{
    try {

        const {email,password,username,roleName} = req.body;

        if(!email || !password || !username){
            return res.status(400).json({
                message: "Email, password, and username are required"
            });
        }

        // Validate roleName if provided
        if(roleName && !['L1', 'L2', 'L3'].includes(roleName)){
            return res.status(400).json({
                message: "Invalid role. Must be L1, L2, or L3"
            });
        }

        const existingEmail = await getUserByEmail(email);

        if(existingEmail){
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const existingUsername = await getUserByUsername(username);

        if(existingUsername){
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        // Use provided role or default to L1
        const targetRoleName = roleName || 'L1';
        const role = await getRoleByName(targetRoleName);

        if(!role){
            return res.status(500).json({
                message: "Role not found. Please run seeder first."
            });
        }


        const hashedPassword = await hashPassword(password);

        const user = await createUser({
            email,
            username,
            roleId: role._id,
            authentication : {
                password: hashedPassword,
            }
        })


        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: targetRoleName,
                createdAt: user.createdAt
            }
        }).end(); 

    } catch(err){
        console.log('Register Error:', err);
        return res.sendStatus(400);
    }
}

export const login = async (req: express.Request, res:express.Response)=>{
    try{
        const {email,password}= req.body;

        if(!email || !password){
            return res.status(400).json({
                message:"Email or Password wrong"
            });
        }

        const user = await getUserByEmail(email).select('+authentication.password').populate('roleId');

        if(!user){
            return res.status(400).json({
                message : "Failed login"
            });
        }

        const isPasswordValid = await comparePassword(password, user.authentication.password);

        if(!isPasswordValid){
            return res.status(403).json({
                message : "Failed login"
            })
        }

        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: (user.roleId as any).name
        });

        user.authentication.sessionToken = token;
        await user.save();

        res.cookie('AUTH', token, {domain:'localhost', path:'/'});

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: (user.roleId as any).name
            },
            token
        }).end();

    }catch(err ){
        console.log('Login Error:', err);
        return res.sendStatus(400);
    }
}

export const logout = async (req: express.Request, res:express.Response)=>{
    try{
        res.clearCookie('AUTH',{domain:'localhost', path:'/'});

        return  res.sendStatus(200).end();

    }catch(err){
        console.log('Logout Error:', err);
        return res.sendStatus(400);
    }
}