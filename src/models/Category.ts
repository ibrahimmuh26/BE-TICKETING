import mongoose from "mongoose";

export interface ICategory extends Document {
  name: string;
  description: string;
  isActive: boolean;
}

const categorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});