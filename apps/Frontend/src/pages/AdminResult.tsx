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
        ).map(title => ({
          title,
          artist: artistMap[title.toLowerCase()] || ''
        }))
      : [];

  // when suggestion clicked: create song, show, activate and navigate
  const handleQuickSelect = async (title: string) => {
    setCreating(true);
    setError(null);
    try {
      const artist = artistMap[title.toLowerCase()] || '';
      // 1) find or create song with correct artist
      const songRes = await axiosInstance.post<{ _id: string }>('/songs', {
        artist,
        title
      });
      const songId = songRes.data._id;

      // 2) create show
      const showRes = await axiosInstance.post<{ _id: string }>('/shows', {
        name: `${artist} – ${title}`,
        songId
      });
      const showId = showRes.data._id;

      // 3) activate show
      await axiosInstance.put(`/shows/${showId}`, { status: 'active' });

      navigate(`/shows/${showId}`);
    } catch (e: any) {
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
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  if (!isAdmin) {
    return <Member />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-[#516578]">Admin Main Page</h1>

      {/* Quick suggestions */}
      <ListSongs
        songs={suggestions.map(suggestion => suggestion.title)}
        onSelect={handleQuickSelect}
      />
      {creating && <p className="text-gray-500 mb-4">Starting session…</p>}

      {/* Full SongSearch form */}
      <SongSearch
        initialTitle={query}
        onSongAdded={handleSongAdded}
      />
    </div>
  );
};

export default AdminResult;
