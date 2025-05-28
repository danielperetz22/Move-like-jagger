import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import axiosInstance from '../axiosinstance';

interface SongSearchProps {
  initialTitle?: string;
  onSongAdded: (showId: string) => void;
}

interface IdResponse {
  _id: string;
}

export const SongSearch: React.FC<SongSearchProps> = ({
  initialTitle = '',
  onSongAdded,
}) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!initialTitle) return;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data } = await axiosInstance.post<{
          correctedTitle: string;
          alternativeTitles?: string[];  // Updated to match new API
          alternativeTitle?: string;     // Keep for backward compatibility
          artistName: string;
        }>('/gemini/song-completion', {
          songName: initialTitle.trim(),
        });

        setTitle(data.correctedTitle);
        setArtist(data.artistName);
        
        // Use alternativeTitles array if available, otherwise fallback to old format
        let altOptions: string[] = [];
        if (data.alternativeTitles && data.alternativeTitles.length > 0) {
          altOptions = data.alternativeTitles;
        } else if (data.alternativeTitle && data.alternativeTitle !== data.correctedTitle) {
          altOptions = [data.alternativeTitle];
        }
        
        setAlternatives(altOptions);
      } catch (e) {
        console.error('Gemini autocomplete error', e);
        setError('Failed to autocomplete song info');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [initialTitle]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Please enter a song title');
      return;
    }

    try {
      setIsLoading(true);

      // run Gemini on whatever is currently in title (user may have edited)
      const { data: comp } = await axiosInstance.post<{
        correctedTitle: string;
        alternativeTitles?: string[];  // Updated to match new API
        alternativeTitle?: string;     // Keep for backward compatibility
        artistName: string;
      }>('/gemini/song-completion', {
        songName: title.trim(),
      });

      const corrected = comp.correctedTitle;
      setTitle(corrected);
      setArtist(prev => prev.trim() || comp.artistName);
      
      // Use alternativeTitles array if available, otherwise fallback to old format
      let altOptions: string[] = [];
      if (comp.alternativeTitles && comp.alternativeTitles.length > 0) {
        altOptions = comp.alternativeTitles;
      } else if (comp.alternativeTitle && comp.alternativeTitle !== corrected) {
        altOptions = [comp.alternativeTitle];
      }
      
      setAlternatives(altOptions);

      // Step 1: create or find song
      const songRes = await axiosInstance.post<IdResponse>('/songs', {
        artist: artist.trim() || comp.artistName,
        title: corrected,
      });
      if (!songRes.data._id) {
        throw new Error('Song creation failed');
      }
      const songId = songRes.data._id;

      // Step 2: create show
      const showRes = await axiosInstance.post<IdResponse>('/shows', {
        name: `${artist || comp.artistName} – ${corrected}`,
        songId,
      });
      if (!showRes.data._id) {
        throw new Error('Show creation failed');
      }
      const showId = showRes.data._id;

      // Step 3: activate show
      await axiosInstance.put(`/shows/${showId}`, { status: 'active' });

      setSuccess('Session started! Redirecting…');
      setTimeout(() => onSongAdded(showId), 800);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unexpected error creating session'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle selecting an alternative
  const handleSelectAlternative = async (alt: string) => {
    setTitle(alt);
    
    // Get the artist for this title using Gemini
    try {
      const { data } = await axiosInstance.post<{
        correctedTitle: string;
        alternativeTitle: string;
        artistName: string;
      }>('/gemini/song-completion', {
        songName: alt.trim(),
      });
      
      setArtist(data.artistName);
    } catch (e) {
      console.error('Failed to get artist for selected song', e);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 mb-8">

      <p className="mb-2 font-semibold font-assistant text-2xl">
        Available songs with lyrics only matching your search:</p>


      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-6">
        {/* Song Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Song Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter song title"
            disabled={isLoading}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Artist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Artist
          </label>
          <input
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            placeholder="Enter artist name"
            disabled={isLoading}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !title.trim()}
          className="w-full"
        >
          {isLoading ? 'Loading…' : 'Start Live Session'}
        </Button>
      </form>

      {alternatives.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Other song options:
          </p>
          <div className="flex flex-col gap-2">
            {alternatives.map((alt, index) => (
              <Button
                key={index}
                type="button"
                onClick={() => handleSelectAlternative(alt)}
              >
                {alt}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SongSearch;
