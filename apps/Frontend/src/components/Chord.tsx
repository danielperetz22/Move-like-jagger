import React from 'react';

interface ChordProps {
  chordSymbol: string;
}

const Chord: React.FC<ChordProps> = ({ chordSymbol }) => (
  <div className="
    flex items-center justify-center 
    h-10 px-3 bg-blue-600 text-white rounded-lg 
    shadow hover:bg-blue-500 transition whitespace-nowrap
  ">
    <span className="font-semibold">{chordSymbol}</span>
  </div>
);

export default Chord;
