import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IShow extends Document {
  name: string;
  createdBy: Types.ObjectId;
  song: {
    _id: string;
    title: string;
    artist: string;
    lyrics: string;
    chords: any[];
  };
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ShowSchema: Schema = new Schema({
  name:         { type: String, required: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  song: {
    _id:        { type: String, required: true },
    title:      { type: String, required: true },
    artist:     { type: String, required: true },
    lyrics:     { type: String, default: '' },
    chords:     { type: Array,  default: [] }
  },

  status:       { type: String, enum: ['active','completed'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model<IShow>('Show', ShowSchema);
