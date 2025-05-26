import mongoose from 'mongoose';

const ChordDefinitionSchema = new mongoose.Schema({
  id:         { type: String, required: true },      
  name:       { type: String, required: true },      
  notes:      [String],                              
  intervals:  [String],                            
  midiKeys:   [Number]                          
}, { _id: false });

const SongSchema = new mongoose.Schema({
  artist:       { type: String, required: true },
  title:        { type: String, required: true },
  rawLyrics:    { type: String, required: true },    
  chords:       { type: [ChordDefinitionSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Song', SongSchema);
