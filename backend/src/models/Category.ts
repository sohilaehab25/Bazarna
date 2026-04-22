import mongoose, { Document, Schema } from 'mongoose';

export interface Category extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<Category>('Category', CategorySchema);