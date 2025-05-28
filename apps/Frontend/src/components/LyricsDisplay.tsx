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
interface ChordData {
    pos: number;
    name: string;
}

const LyricsDisplay: React.FC<Props> = ({ artist, title }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [chords, setChords] = useState<ChordData[]>([]);
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
          axiosInstance.get<ChordData[]>('/chords', { params: { title } })
        ]);
        setLyrics(lyricsResp.lyrics || '');
        setChords(chordData);
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
          <div className="flex flex-wrap gap-2">
            {chords.map((c, idx) => (
               <Chord key={idx} chordSymbol={c.name} />
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Play these chords following the song's rhythm
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
