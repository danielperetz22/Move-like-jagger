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
        
        // Fetch chords (will now get fallback data from the backend if API fails)
        try {
            const chordsResponse = await axiosInstance.get<any[]>('/chords', {
                params: { artist, title }
            });
          
            setChords(chordsResponse.data);

        } catch (chordsError) {
          console.log('Chords not available for this song');
          // Set empty chords array, but don't show error
          setChords([]);
        }
        
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError('Failed to load lyrics');
        // Provide default message if lyrics API fails
        setLyrics(`Playing: ${artist} - ${title}\n\n[Lyrics will appear here when available]`);
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

  // Function to render lyrics with line breaks
  const renderLyrics = () => {
    return lyrics.split('\n').map((line, index) => (
      <p key={index} className={line.trim() === '' ? 'h-4' : 'my-1 text-lg leading-relaxed'}>
        {line || '\u00A0'}
      </p>
    ));
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-semibold mb-4 text-blue-300">{artist} - {title}</h3>
      
      {chords.length > 0 && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium mb-3 text-gray-300">Chord Progression:</h4>
          <div className="flex flex-wrap gap-2">
            {chords.map((chord, index) => (
              <Chord key={index} chordSymbol={chord.name} />
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Tip: Play these chords in sequence following the song's rhythm
          </p>
        </div>
      )}
      
      {error ? (
        <div className="p-4 text-yellow-300">{error}</div>
      ) : (
        <div className="whitespace-pre-line font-medium">
          {renderLyrics()}
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-400">
        <p>Note: For complete and accurate lyrics, please refer to official licensed sources.</p>
        <p>This application is for educational purposes only.</p>
      </div>
    </div>
  );
};

export default LyricsDisplay;
