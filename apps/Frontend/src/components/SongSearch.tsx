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

  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New state for popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupSong, setPopupSong] = useState({ title: '', artist: '' });

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

  // const handleSearch = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError(null);
  //   setSuccess(null);

  //   if (!title.trim()) {
  //     setError('Please enter a song title');
  //     return;
  //   }

  //   try {
  //     setIsLoading(true);

  //     // run Gemini on whatever is currently in title (user may have edited)
  //     const { data: comp } = await axiosInstance.post<{
  //       correctedTitle: string;
  //       alternativeTitles?: string[];  // Updated to match new API
  //       alternativeTitle?: string;     // Keep for backward compatibility
  //       artistName: string;
  //     }>('/gemini/song-completion', {
  //       songName: title.trim(),
  //     });

  //     const corrected = comp.correctedTitle;
  //     setTitle(corrected);
  //     setArtist(prev => prev.trim() || comp.artistName);
      
  //     // Use alternativeTitles array if available, otherwise fallback to old format
  //     let altOptions: string[] = [];
  //     if (comp.alternativeTitles && comp.alternativeTitles.length > 0) {
  //       altOptions = comp.alternativeTitles;
  //     } else if (comp.alternativeTitle && comp.alternativeTitle !== corrected) {
  //       altOptions = [comp.alternativeTitle];
  //     }
      
  //     setAlternatives(altOptions);

  //     // Step 1: create or find song
  //     const songRes = await axiosInstance.post<IdResponse>('/songs', {
  //       artist: artist.trim() || comp.artistName,
  //       title: corrected,
  //     });
  //     if (!songRes.data._id) {
  //       throw new Error('Song creation failed');
  //     }
  //     const songId = songRes.data._id;

  //     // Step 2: create show (this will auto-complete any previous shows)
  //     console.log('Creating new show and ending any previous active shows');
  //     const showRes = await axiosInstance.post<IdResponse>('/shows', {
  //       name: `${artist || comp.artistName} – ${corrected}`,
  //       songId,
  //     });
  //     if (!showRes.data._id) {
  //       throw new Error('Show creation failed');
  //     }
  //     const showId = showRes.data._id;

  //     // Step 3: we don't need to activate show anymore as it's active by default
  //     // The backend already takes care of ending previous shows

  //     setSuccess('Session started! Redirecting…');
      
  //     // Give a moment for polling to redirect everyone else
  //     setTimeout(() => onSongAdded(showId), 800);
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(
  //       err.response?.data?.message ||
  //         err.message ||
  //         'Unexpected error creating session'
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Modified function to show popup instead of directly updating form
  const handleSelectAlternative = async (alt: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.post<{
        correctedTitle: string;
        alternativeTitle: string;
        artistName: string;
      }>('/gemini/song-completion', {
        songName: alt.trim(),
      });
      
      // Set popup data and show popup
      setPopupSong({
        title: data.correctedTitle || alt,
        artist: data.artistName
      });
      setShowPopup(true);
    } catch (e) {
      console.error('Failed to get artist for selected song', e);
      setError('Failed to get artist information');
    } finally {
      setIsLoading(false);
    }
  };

  // New function to start session directly from popup
  const startSessionFromPopup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Step 1: create or find song
      const songRes = await axiosInstance.post<IdResponse>('/songs', {
        artist: popupSong.artist,
        title: popupSong.title,
      });
      if (!songRes.data._id) {
        throw new Error('Song creation failed');
      }
      const songId = songRes.data._id;

      // Step 2: create show
      console.log('Creating new show and ending any previous active shows');
      const showRes = await axiosInstance.post<IdResponse>('/shows', {
        name: `${popupSong.artist} – ${popupSong.title}`,
        songId,
      });
      if (!showRes.data._id) {
        throw new Error('Show creation failed');
      }
      const showId = showRes.data._id;

      setSuccess('Session started! Redirecting…');
      setShowPopup(false);
      
      // Give a moment for polling to redirect everyone else
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

  return (
    <div className="w-full font-assistant p-6">
      <h2 className="mb-4 font-semibold text-[#e68c3a] text-xl md:text-2xl lg:text-3xl">
        Available songs with lyrics only:
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          {success}
        </div>
      )}

      {alternatives.length > 0 ? (
        <div className="mt-4 w-full">
          <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {alternatives.map((alt, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div className="h-px bg-gray-200 w-full"></div>}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSelectAlternative(alt)}
                  className="py-3 px-4 text-left hover:bg-gray-50 transition-colors w-full text-sm md:text-base"
                >
                  {alt}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic">No matching songs found</p>
      )}

      {/* Song Selection Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-auto shadow-xl font-assistant">
            <h3 className="text-lg md:text-2xl font-semibold mb-4 text-[#e68c3a]">Start Live Session</h3>
            
            <div className="mb-3 md:mb-4">
              <p className="font-medium text-gray-700">Song Title:</p>
              <p className="text-base md:text-lg">{popupSong.title}</p>
            </div>
            
            <div className="mb-5 md:mb-6">
              <p className="font-medium text-gray-700">Artist:</p>
              <p className="text-base md:text-lg">{popupSong.artist}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowPopup(false)}
                disabled={isLoading}
                className="px-3 py-2"
              >
                Cancel
              </Button>
              
              <Button 
                variant="primary" 
                onClick={startSessionFromPopup}
                disabled={isLoading}
                className="px-3 py-2 hover:text-[#d07a2d]"
              >
                {isLoading ? 'Starting...' : 'Start Live Session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongSearch;
