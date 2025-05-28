// LyricsDisplay.tsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosinstance';
import Chord from './Chord';

interface Props {
  artist: string;
  title: string;
}

interface LyricsResponse {
  lyrics: string;
  source?: string;
}
type ChordSymbol = string;
function cleanChord(symbol: string): string {
  return symbol
    .replace(',,', '') 
    .replace(/,/g, ''); 
}

const LyricsDisplay: React.FC<Props> = ({ artist, title }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [chords, setChords] = useState<ChordSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
  
      try {
        const [{ data: lyricsResp }, { data: chordData }] = await Promise.all([
          axiosInstance.get<LyricsResponse>(
            `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
          ),
          axiosInstance.get<string[]>('/chords', { params: { title } })
        ]);
        setLyrics(lyricsResp.lyrics || '');
        setChords(chordData.map(cleanChord));
      } catch {
        setError('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [artist, title]);
  

  if (isLoading) return <div className="p-4 text-center">Loading lyrics and chords...</div>;

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-semibold mb-4 text-blue-300">{artist} - {title}</h3>

      {chords.length > 0 && (
  <div className="mb-6 p-4 bg-gray-700 rounded-lg">
    <h4 className="text-sm font-medium mb-3 text-gray-300">Chord Progression:</h4>
    <div
      className="
        grid 
        grid-cols-[repeat(auto-fit,_minmax(64px,_1fr))] 
        gap-3 
        md:grid-cols-[repeat(auto-fit,_minmax(80px,_1fr))]
      "
    >
      {chords.map((symbol, idx) => (
        <Chord key={idx} chordSymbol={symbol} />
      ))}
    </div>
    <p className="mt-3 text-xs text-gray-400">
      Play these chords following the song’s rhythm
    </p>
  </div>
)}

      {error ? (
        <div className="p-4 text-yellow-300">{error}</div>
      ) : (
        <div className="whitespace-pre-line text-lg leading-relaxed">
          {lyrics || '\u00A0'}
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;
