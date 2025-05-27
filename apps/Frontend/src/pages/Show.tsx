import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Button from '../components/ui/Button';
import LyricsDisplay from '../components/LyricsDisplay';

interface ShowDetails {
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
  song: {
    _id: string;
    title: string;
    artist: string;
    rawLyrics?: string;
    chords: any[];
  };
  participants: Array<{
    userId: {
      _id: string;
      username: string;
      instrument: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  status: 'created' | 'active' | 'completed';
  createdAt: string;
}

interface UserResponse {
  _id: string;
  username: string;
  instrument: string;
  admin: boolean;
}

const ShowPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [userInstrument, setUserInstrument] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get user details to determine instrument and admin status
        const userResponse = await axiosInstance.get<UserResponse>('/auth/me');
        setUserInstrument(userResponse.data.instrument);
        setIsAdmin(userResponse.data.admin);
        
        // Get show details
        const showResponse = await axiosInstance.get<ShowDetails>(`/shows/${showId}`);
        setShow(showResponse.data);
      } catch (err: any) {
        console.error('Error fetching show details:', err);
        setError(err.response?.data?.message || 'Failed to load show details');
      } finally {
        setIsLoading(false);
      }
    };

    if (showId) {
      fetchData();
    }
  }, [showId, userId]);

  const endShow = async () => {
    if (!show) return;
    
    try {
      setIsLoading(true);
      await axiosInstance.put(`/shows/${show._id}`, { status: 'completed' });
      navigate('/music');
    } catch (err) {
      console.error('Error ending show:', err);
      setError('Failed to end the session');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
        <Button 
          variant="secondary"
          onClick={() => navigate('/music')}
          className="mt-4"
        >
          Back to Music
        </Button>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Session not found</p>
        </div>
        <Button 
          variant="secondary"
          onClick={() => navigate('/music')}
          className="mt-4"
        >
          Back to Music
        </Button>
      </div>
    );
  }

  const isVocalist = userInstrument?.toLowerCase() === 'vocals';
  const isCreator = show.createdBy._id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#516578]">{show.name}</h1>
          <p className="text-lg text-gray-600">
            {show.song.artist} - {show.song.title}
          </p>
        </div>
        
        {isAdmin && isCreator && show.status === 'active' && (
          <Button 
            variant="secondary"
            onClick={endShow}
          >
            End Session
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - lyrics and chords */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#516578]">
              {isVocalist ? 'Lyrics' : 'Lyrics & Chords'}
            </h2>
            
            {/* Display lyrics */}
            <div className="mb-6">
              {show && show.song && (
                <LyricsDisplay 
                  artist={show.song.artist} 
                  title={show.song.title} 
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar - participants */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#516578]">Participants</h2>
            
            <div className="space-y-3">
              {show.participants
                .filter(p => p.status === 'accepted')
                .map(participant => (
                  <div 
                    key={participant.userId._id} 
                    className="flex items-center p-2 border-b last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-800 font-semibold">
                        {participant.userId.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{participant.userId.username}</p>
                      <p className="text-sm text-gray-600">{participant.userId.instrument}</p>
                    </div>
                  </div>
                ))}
              
              {show.participants.filter(p => p.status === 'accepted').length === 0 && (
                <p className="text-gray-500">No participants have joined yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowPage;