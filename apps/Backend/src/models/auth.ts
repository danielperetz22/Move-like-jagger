import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  admin?: boolean;  
  _id: string;  
  email: string;
  username: string;
  password: string;
  instrument: string;
  refreshTokens: string[];
}

const UserSchema: Schema = new Schema(
  {
    admin: { type: Boolean, default: false },
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString()},
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, default: '' },
    instrument: { type: String, required: true },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
