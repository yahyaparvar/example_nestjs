import { Document, Schema } from 'mongoose';

export const AvatarSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  hash: { type: String, required: true },
});

export interface Avatar extends Document {
  userId: string;
  hash: string;
}

export type AvatarDocument = Avatar & Document;
