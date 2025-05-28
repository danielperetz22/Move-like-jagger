import React, { useState, useEffect, useRef } from 'react';
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

const Show: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollIntervalId, setScrollIntervalId] = useState<number | null>(null);
  const [showChords, setShowChords] = useState(true);

  
  useEffect(() => {
    if (!isAuthenticated || !id) {
      navigate('/login');
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user info
        const userResponse = await axiosInstance.get<UserResponse>('/auth/me');
        const me = userResponse.data;
        setIsAdmin(me.admin);
        
        // Get show details
        const showResponse = await axiosInstance.get<ShowDetails>(`/shows/${id}`);
        const s = showResponse.data;
        setShow(s);
        if (me.instrument.toLowerCase() === 'vocals') {
          setShowChords(false);
        } else {
          const myPart = s.participants.find(p => p.userId._id === me._id);
          if (myPart) {
            setShowChords(myPart.userId.instrument.toLowerCase() !== 'vocals');
          } else {
            // not in participants => show chords as before
            setShowChords(true);
          }
        }
        
      } catch (err) {
        console.error('Error fetching show details:', err);
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup interval on unmount
    return () => {
      if (scrollIntervalId) {
        window.clearInterval(scrollIntervalId);
      }
    };
  }, [id, isAuthenticated, navigate]);
  
  // Toggle auto-scrolling
  const toggleAutoScroll = () => {
    if (isAutoScrolling && scrollIntervalId) {
      window.clearInterval(scrollIntervalId);
      setScrollIntervalId(null);
      setIsAutoScrolling(false);
    } else {
      const intervalId = window.setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollBy({ 
            top: 1, 
            behavior: 'smooth' 
          });
        }
      }, 100); // Adjust speed as needed
      
      setScrollIntervalId(intervalId);
      setIsAutoScrolling(true);
    }
  };
  
  // End the session (admin only)
  const endSession = async () => {
    if (!show || !isAdmin) return;
    
    try {
      setIsLoading(true);
      await axiosInstance.put(`/shows/${show._id}`, { status: 'completed' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (error || !show) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error || 'Session not found'}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {show.song.artist} - {show.song.title}
            </h1>
          </div>
          
          {isAdmin && (
            <Button variant="danger" onClick={endSession}>
              Quit
            </Button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div 
        ref={contentRef}
        className="container mx-auto px-4 py-8 overflow-y-auto"
        style={{ height: 'calc(100vh - 70px)' }} // Adjust based on header height
      >
        {/* Display lyrics and chords for all users */}
        < LyricsDisplay
          artist={show.song.artist}
          title={show.song.title}
          showChords={showChords}
        />
      </div>
      
      {/* Floating auto-scroll button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={toggleAutoScroll}
          className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors ${
            isAutoScrolling ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isAutoScrolling ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Show;