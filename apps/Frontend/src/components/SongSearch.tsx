import React, { useState } from 'react';
import axiosInstance from '../axiosinstance';
import Button from './ui/Button';

interface SongSearchProps {
  onSongAdded: (showId: string) => void; // Called when a show is created with the song
}

// add minimal response shape
interface IdResponse { _id: string; }

const SongSearch: React.FC<SongSearchProps> = ({ onSongAdded }) => {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!artist || !title) {
      setError('Please enter both artist and title');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Step 1: Create/find the song in the database
      const songResponse = await axiosInstance.post<IdResponse>('/songs', {
        artist: artist.trim(),
        title: title.trim()
      });
      
      console.log('Song created/found:', songResponse.data);
      
      if (!songResponse.data || !songResponse.data._id) {
        throw new Error('Failed to create song');
      }
      
      const songId = songResponse.data._id;
      
      try {
        // Step 2: Create a show with this song
        console.log('Creating show with song ID:', songId);
        const showResponse = await axiosInstance.post<IdResponse>('/shows', {
          name: `${artist} - ${title}`,
          songId
        });
        
        console.log('Show created:', showResponse.data);
        
        if (!showResponse.data || !showResponse.data._id) {
          throw new Error('Failed to create show');
        }
        
        const showId = showResponse.data._id;
        
        // Step 3: Activate the show
        console.log('Activating show:', showId);
        await axiosInstance.put<IdResponse>(`/shows/${showId}`, { 
          status: 'active' 
        });
        
        setSuccess(`Song found! Redirecting to live view...`);
        
        setArtist('');
        setTitle('');
        
        setTimeout(() => {
          onSongAdded(showId);
        }, 1000);
      } catch (showErr) {
        console.error('Error creating or activating show:', showErr);
        setError('Found the song but failed to create a session. Please try again.');
      }
    } catch (err: any) {
      console.error('Error searching/creating song:', err);
      
      // Get error message
      let errorMessage = 'Failed to find or save the song';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-[#516578]">Search any song...</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter artist name"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Song Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter song title"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !artist || !title}
        >
          {isLoading ? 'Searching...' : 'Start Live Session'}
        </Button>
      </form>
    </div>
  );
};

export default SongSearch;
