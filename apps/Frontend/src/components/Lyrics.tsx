import React from 'react';

interface LyricsProps {
  lyrics: string;
}

const Lyrics: React.FC<LyricsProps> = ({ lyrics }) => {
  return (
    <div className="lyrics whitespace-pre-line">
      {lyrics}
    </div>
  );
};

export default Lyrics;