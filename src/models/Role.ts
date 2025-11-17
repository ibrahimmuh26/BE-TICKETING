import mongoose, { mongo } from "mongoose";

export  interface IRole extends Document {
    name : string;
    permissions : string[];
    description? : string;
}

const roleSchema = new mongoose.Schema<IRole>({
    name : {
        type : String ,
        required : true,
        unique : true,
        enum : ['L1','L2','L3']
    },
    permissions : [{type : String}],
    description : String
    },{
        timestamps: true
    }
);

const RoleModel= mongoose.model<IRole>('Role',roleSchema);

export const getRoles = () => RoleModel.find();

export const getRoleById = (id : string) => RoleModel.findById(id);

export const getRoleByName = (name : string) => RoleModel.findOne({name});

export const createRole = (values : Partial<IRole>) => {
    return new RoleModel(values).save();
}

export const deleteRoleById = ( id : string ) => RoleModel.findByIdAndDelete(id);

export const updateRoleById = ( id : string, values : Partial<IRole> ) => 
    RoleModel.findByIdAndUpdate(id,values,{new : true});

export default RoleModel;