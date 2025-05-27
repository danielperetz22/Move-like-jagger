import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosinstance';
import Chord from './Chord';

interface LyricsDisplayProps {
  artist: string;
  title: string;
}

// Define the response type
interface LyricsResponse {
  lyrics: string;
  source: string;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ artist, title }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [chords, setChords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch lyrics on demand with proper typing
        const response = await axiosInstance.get<LyricsResponse>(`/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        
        if (response.data && response.data.lyrics) {
          setLyrics(response.data.lyrics);
        } else {
          setError('No lyrics available for this song');
        }
        
        // Optionally fetch chords (if you have a chords API)
        try {
          const chordsResponse = await axiosInstance.get('/chords', {
            params: { artist, title }
          });
          
          if (chordsResponse.data && Array.isArray(chordsResponse.data)) {
            setChords(chordsResponse.data);
          }
        } catch (chordsError) {
          console.log('Chords not available for this song');
          // Don't set an error, just continue without chords
        }
        
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError('Failed to load lyrics');
      } finally {
        setIsLoading(false);
      }
    };

    if (artist && title) {
      fetchLyrics();
    }
  }, [artist, title]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading lyrics...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  // Function to render lyrics with line breaks
  const renderLyrics = () => {
    return lyrics.split('\n').map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'h-4' : 'my-1'}>
        {line || '\u00A0'}
      </p>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">{artist} - {title}</h3>
      
      {chords.length > 0 && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Chords:</h4>
          <div className="flex flex-wrap">
            {chords.map((chord, index) => (
              <Chord key={index} chordSymbol={chord.name} />
            ))}
          </div>
        </div>
      )}
      
      <div className="whitespace-pre-line font-medium">
        {renderLyrics()}
      </div>
    </div>
  );
};

export default LyricsDisplay;
