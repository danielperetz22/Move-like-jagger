import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Button from '../components/ui/Button';
import SongSearch from '../components/SongSearch';

interface User {
  _id: string;
  username: string;
  instrument: string;
}

interface Group {
  _id: string;
  name: string;
  members: User[];
}

interface Song {
  _id: string;
  title: string;
  artist: string;
  lyrics: string;
}

interface Participant {
  userId: {
    _id: string;
    username: string;
    instrument: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

interface Show {
  _id: string;
  name: string;
  createdBy: {
    _id: string;
    username: string;
  };
  groupId: {
    _id: string;
    name: string;
  };
  song: Song;
  participants: Participant[];
  status: 'created' | 'active' | 'completed';
  createdAt: string;
}

// API response interfaces
interface UserResponse {
  _id: string;
  username: string;
  email: string;
  admin: boolean;
  instrument: string;
}

const MusicPage: React.FC = () => {
  const { userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [myShows, setMyShows] = useState<Show[]>([]);
  const [groupId, setGroupId] = useState('');
  const [songId, setSongId] = useState('');
  const [showName, setShowName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get user info
        const userResponse = await axiosInstance.get<UserResponse>('/auth/me');
        setIsAdmin(userResponse.data.admin);
        
        // Get groups
        const groupsResponse = await axiosInstance.get<Group[]>('/groups');
        setGroups(groupsResponse.data);
        
        // Get songs (for admins)
        if (userResponse.data.admin) {
          // Make sure this endpoint is correct - it might need to be '/api/songs' or similar
          const songsResponse = await axiosInstance.get<Song[]>('/songs');
          
          // Log response to debug
          console.log('Songs response:', songsResponse.data);
          
          // Check if the response has the expected structure
          if (Array.isArray(songsResponse.data)) {
            setSongs(songsResponse.data);
          } else {
            console.error('Songs response is not an array:', songsResponse.data);
            setSongs([]);
          }
        }
        
        // Get shows
        const showsResponse = await axiosInstance.get<Show[]>('/shows/my-shows');
        setMyShows(showsResponse.data);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate]);

  const createShow = async () => {
    if (!showName || !groupId || !songId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post<Show>('/shows', {
        name: showName,
        groupId,
        songId
      });
      
      setMyShows([...myShows, response.data]);
      setShowName('');
      setGroupId('');
      setSongId('');
      setError(null);
    } catch (err: any) {
      console.error('Error creating show:', err);
      setError(err.response?.data?.message || 'Failed to create show');
    } finally {
      setIsLoading(false);
    }
  };

  const updateParticipation = async (showId: string, status: 'accepted' | 'rejected') => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.put<Show>('/shows/participation', {
        showId,
        status
      });
      
      // Update shows list with updated participation status
      setMyShows(myShows.map(show => 
        show._id === showId ? response.data : show
      ));
    } catch (err) {
      console.error('Error updating participation:', err);
      setError('Failed to update participation status');
    } finally {
      setIsLoading(false);
    }
  };

  const startShow = async (showId: string) => {
    try {
      setIsLoading(true);
      await axiosInstance.put<Show>(`/shows/${showId}`, { status: 'active' });
      navigate(`/shows/${showId}`);
    } catch (err) {
      console.error('Error starting show:', err);
      setError('Failed to start show');
      setIsLoading(false);
    }
  };

  const refreshSongs = async () => {
    try {
      const songsResponse = await axiosInstance.get<Song[]>('/songs');
      setSongs(songsResponse.data);
    } catch (err) {
      console.error('Error refreshing songs:', err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#516578]">Music Sessions</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Song search component (admin only) */}
      {isAdmin && (
        <SongSearch onSongAdded={refreshSongs} />
      )}
      
      {/* Create show form (admin only) */}
      {isAdmin && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#516578]">Create New Session</h2>
          
          {/* Show song count or empty message */}
          <p className="mb-4 text-gray-600">
            {songs.length === 0 
              ? "You don't have any songs yet. Add some songs above before creating a session."
              : `You have ${songs.length} song${songs.length !== 1 ? 's' : ''} available.`
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
              <input
                type="text"
                value={showName}
                onChange={e => setShowName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter session name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a group --</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Song</label>
              <select
                value={songId}
                onChange={e => setSongId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a song --</option>
                {songs.map(song => (
                  <option key={song._id} value={song._id}>{song.artist} - {song.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            onClick={createShow} 
            variant="primary"
            disabled={!showName || !groupId || !songId}
          >
            Create Session
          </Button>
        </div>
      )}
      
      {/* My shows */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-[#516578]">My Sessions</h2>
        
        {myShows.length === 0 ? (
          <p className="text-gray-500">You don't have any music sessions yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Pending invitations */}
            {!isAdmin && (
              <div>
                <h3 className="text-xl font-medium mb-3 text-[#516578]">Invitations</h3>
                <div className="space-y-4">
                  {myShows.filter(show => 
                    show.participants.some(p => 
                      p.userId._id === userId && p.status === 'pending'
                    )
                  ).map(show => (
                    <div key={show._id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{show.name}</h4>
                        <p className="text-sm text-gray-600">
                          Song: {show.song.artist} - {show.song.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created by: {show.createdBy.username}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="primary" 
                          onClick={() => updateParticipation(show._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => updateParticipation(show._id, 'rejected')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!myShows.some(show => 
                    show.participants.some(p => 
                      p.userId._id === userId && p.status === 'pending'
                    )
                  ) && (
                    <p className="text-gray-500">No pending invitations.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Active shows */}
            <div>
              <h3 className="text-xl font-medium mb-3 text-[#516578]">Active Sessions</h3>
              <div className="space-y-4">
                {myShows.filter(show => 
                  show.status === 'active' && (
                    isAdmin || show.participants.some(p => 
                      p.userId._id === userId && p.status === 'accepted'
                    )
                  )
                ).map(show => (
                  <div key={show._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{show.name}</h4>
                      <p className="text-sm text-gray-600">
                        Song: {show.song.artist} - {show.song.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Group: {show.groupId.name}
                      </p>
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/shows/${show._id}`)}
                    >
                      Join Session
                    </Button>
                  </div>
                ))}
                {!myShows.some(show => 
                  show.status === 'active' && (
                    isAdmin || show.participants.some(p => 
                      p.userId._id === userId && p.status === 'accepted'
                    )
                  )
                ) && (
                  <p className="text-gray-500">No active sessions.</p>
                )}
              </div>
            </div>
            
            {/* Upcoming shows (created but not active) */}
            {isAdmin && (
              <div>
                <h3 className="text-xl font-medium mb-3 text-[#516578]">Ready to Start</h3>
                <div className="space-y-4">
                  {myShows.filter(show => 
                    show.status === 'created' && 
                    show.participants.every(p => p.status !== 'pending')
                  ).map(show => (
                    <div key={show._id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{show.name}</h4>
                        <p className="text-sm text-gray-600">
                          Song: {show.song.artist} - {show.song.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Participants: {show.participants.filter(p => p.status === 'accepted').length}/{show.participants.length} accepted
                        </p>
                      </div>
                      <Button 
                        variant="primary" 
                        onClick={() => startShow(show._id)}
                      >
                        Start Session
                      </Button>
                    </div>
                  ))}
                  {!myShows.some(show => 
                    show.status === 'created' && 
                    show.participants.every(p => p.status !== 'pending')
                  ) && (
                    <p className="text-gray-500">No sessions ready to start.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Completed shows */}
            <div>
              <h3 className="text-xl font-medium mb-3 text-[#516578]">Past Sessions</h3>
              <div className="space-y-4">
                {myShows.filter(show => 
                  show.status === 'completed' && (
                    isAdmin || show.participants.some(p => 
                      p.userId._id === userId && p.status === 'accepted'
                    )
                  )
                ).map(show => (
                  <div key={show._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{show.name}</h4>
                      <p className="text-sm text-gray-600">
                        Song: {show.song.artist} - {show.song.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(show.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => navigate(`/shows/${show._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
                {!myShows.some(show => 
                  show.status === 'completed' && (
                    isAdmin || show.participants.some(p => 
                      p.userId._id === userId && p.status === 'accepted'
                    )
                  )
                ) && (
                  <p className="text-gray-500">No past sessions.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPage;