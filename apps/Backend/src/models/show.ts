import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './auth';

export interface IShow extends Document {
  name: string;
  createdBy: Types.ObjectId;
  groupId: Types.ObjectId;
  song: {
    _id: string;
    title: string;
    artist: string;
    lyrics: string;
    chords: any[];
  };
  participants: {
    userId: Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  status: 'created' | 'active' | 'completed';
  createdAt: Date;
}

const ShowSchema: Schema = new Schema({
  name: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  song: {
    _id: { type: String },
    title: { type: String },
    artist: { type: String },
    lyrics: { type: String },
    chords: [{ type: Schema.Types.Mixed }]
  },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }],
  status: { type: String, enum: ['created', 'active', 'completed'], default: 'created' }
}, { timestamps: true });

export default mongoose.model<IShow>('Show', ShowSchema);
