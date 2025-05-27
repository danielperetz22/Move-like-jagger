import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './auth';

export interface IShow extends Document {
  name: string;
  createdBy: Types.ObjectId;
  groupId?: Types.ObjectId; // Make groupId optional
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
  updatedAt: Date;
}

const ShowSchema: Schema = new Schema({
  name: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' }, // Make optional
  song: {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    lyrics: { type: String, default: '' },
    chords: { type: Array, default: [] }
  },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }],
  status: { type: String, enum: ['created', 'active', 'completed'], default: 'created' }
}, { timestamps: true });

export default mongoose.model<IShow>('Show', ShowSchema);
