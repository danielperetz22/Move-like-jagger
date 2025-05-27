import mongoose from "mongoose";

const ChordDefinitionSchema = new mongoose.Schema({
  id:         { type: String, required: true },      
  name:       { type: String, required: true },      
  notes:      [String],                              
  intervals:  [String],                            
  midiKeys:   [Number]                          
}, { _id: false });

const SongSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  artist:    { type: String, required: true, trim: true },
  title:     { type: String, required: true, trim: true },
  rawLyrics: { 
    type: String, 
    required: true,
    default: 'Lyrics not available' 
  },    
  chords:    { 
    type: [ChordDefinitionSchema], 
    default: [] 
  },
}, {
  timestamps: true
});

// prevent duplicates per admin
SongSchema.index({ admin: 1, artist: 1, title: 1 }, { unique: true });

export default mongoose.model('Song', SongSchema);