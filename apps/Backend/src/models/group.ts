
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './auth';

export interface IGroup extends Document {
name: string;
createdBy: Types.ObjectId;
members: Types.ObjectId[];
}

const GroupSchema: Schema = new Schema({
name: { type: String, required: true },
createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Group', GroupSchema);