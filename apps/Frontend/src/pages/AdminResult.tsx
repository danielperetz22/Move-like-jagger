// pages/AdminResult.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Member from '../components/Member';
import SongSearch from '../components/SongSearch';
import ListSongs from '../components/ListSongs';

interface UserResponse {
  _id: string;
  admin: boolean;
}
interface ActiveShow { _id: string; }

// static list of songs that have chords and their artists
const quickList = [
  'aba by Shlomi Shabat',
  'shape of you by Ed Sheeran',
  'hey jude by The Beatles',
  'veech shelo by Ariel Zilberg'
];

// Map with just the song title as key (without the "by Artist" part)
const artistMap: Record<string, string> = {
  'aba': 'Shlomi Shabat',
  'shape of you': 'Ed Sheeran',
  'hey jude': 'The Beatles',
  'veech shelo': 'Ariel Zilberg'
};

const AdminResult: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const query = params.get('query') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // suggestions only if query length >= 3
  const suggestions =
    query.trim().length >= 3
      ? quickList.filter(name =>
          name.toLowerCase().includes(query.trim().toLowerCase())
        )
      : [];

  // Modified to extract just the song title part before "by"
  const handleQuickSelect = async (fullTitle: string) => {
    setCreating(true);
    setError(null);
    try {
      // Extract the title part (before "by")
      const titlePart = fullTitle.split(" by ")[0].trim();
      const artist = artistMap[titlePart.toLowerCase()] || '';
      
      console.log(`Creating song: "${titlePart}" by "${artist}"`);
      
      // 1) find or create song with correct artist
      const songRes = await axiosInstance.post<{ _id: string }>('/songs', {
        artist,
        title: titlePart // Send just the title part, not the full string
      });
      const songId = songRes.data._id;

      // 2) create show
      const showRes = await axiosInstance.post<{ _id: string }>('/shows', {
        name: `${artist} – ${titlePart}`,
        songId
      });
      const showId = showRes.data._id;

      // 3) activate show
      await axiosInstance.put(`/shows/${showId}`, { status: 'active' });

      navigate(`/shows/${showId}`);
    } catch (e: any) {
      console.error("Error creating song:", e);
      setError(e.response?.data?.message || e.message);
    } finally {
      setCreating(false);
    }
  };

  // when SongSearch completes
  const handleSongAdded = (showId: string) => {
    navigate(`/shows/${showId}`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get<UserResponse>('/auth/me');
        setIsAdmin(data.admin);
        if (!data.admin) {
          // redirect member to active show if exists
          try {
            const active = await axiosInstance.get<ActiveShow>('/shows/active');
            if (active.data._id) {
              navigate(`/shows/${active.data._id}`);
            }
          } catch {}
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-[#f4f2ef]">Loading...</div>;
  }
  if (!isAdmin) {
    return <Member />;
  }

  return (
    <div className="min-h-screen bg-[#f4f2ef] py-24" >
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl xl:max-w-5xl mx-auto bg-white px-4 py-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Quick suggestions section with explicit title */}
        <div className="p-6 mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-[#e68c3a]">
            Available songs with chords:
          </h2>
          
          {suggestions.length > 0 ? (
            <ListSongs
              songs={suggestions}
              onSelect={handleQuickSelect}
            />
          ) : (
            <p className="text-gray-500 italic">Enter at least 3 characters to see song suggestions</p>
          )}
          
          {creating && <p className="text-gray-500 mt-4">Starting session…</p>}
        </div>

        {/* SongSearch component with hidden form */}
        <SongSearch
          initialTitle={query}
          onSongAdded={handleSongAdded}
        />
      </div>
    </div>
  );
};

export default AdminResult;
