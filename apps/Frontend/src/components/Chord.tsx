import React from 'react';

interface ChordProps {
  chordSymbol: string;
}

const Chord: React.FC<ChordProps> = ({ chordSymbol }) => (
  <div className="inline-block px-3 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors">
    <span className="font-medium">{chordSymbol}</span>
  </div>
);

export default Chord;