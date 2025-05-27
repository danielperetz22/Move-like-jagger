import React from 'react';

interface ChordProps {
  chordSymbol: string;
}

const Chord: React.FC<ChordProps> = ({ chordSymbol }) => {
  return (
    <div className="inline-block px-3 py-1 m-1 bg-gray-200 rounded text-center">
      <span className="font-medium">{chordSymbol}</span>
    </div>
  );
};

export default Chord;