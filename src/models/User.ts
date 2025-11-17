import mongoose from "mongoose";
import RoleModel from './Role';
import { escape } from "querystring";

export interface IUser extends mongoose.Document {
    username: string;
    email: string;
    roleId: mongoose.ObjectId;
    authentication: {
        password: string;
        salt?: string;
        sessionToken?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Role',
        required:true
    },
    authentication: {
        password: { type: String, required: true, select: false },
        salt: { type: String, select: false },
        sessionToken: { type: String, select: false },
    },
   
}, {
    timestamps: true,
});

const UserModel = mongoose.model<IUser>('User', userSchema);

export const getUsers = () => UserModel.find();

export const getUsersWithRole = () => UserModel.find().populate('roleId');

export const getUserByEmail=(email: string) => UserModel.findOne({ email });

export const getUserByUsername=(username: string) => UserModel.findOne({ username });

export const getUserById=(id: string) => UserModel.findById(id);

export const createUser =(value: Record<string, any>) => new UserModel(value).save().then((user) => user.toObject());

export const deleteUserById=(id: string) => UserModel.findByIdAndDelete(id);

export const updateUserById=(id: string, value: Record<string, any>) => UserModel.findByIdAndUpdate(id, value);

export const getUsersByRoleName = async (roleName : string) => {
    const RoleModel = mongoose.model('Role');

    const role = await RoleModel.findOne({name : roleName});

    if(!role) return [];

    return UserModel.find({roleId :role._id}).populate('roleId');
}

export const getUsersByRoleId = (roleId : string) => UserModel.find({roleId}).populate('roleId');

export default UserModel;