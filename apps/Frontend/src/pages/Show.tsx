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
  groupId?: {
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
  participants?: Array<{
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
          // Check if participants array exists before accessing it
          if (s.participants && s.participants.length > 0) {
            const myPart = s.participants.find(p => p.userId._id === me._id);
            if (myPart) {
              setShowChords(myPart.userId.instrument.toLowerCase() !== 'vocals');
            } else {
              // not in participants => show chords as before
              setShowChords(true);
            }
          } else {
            // No participants array, default to showing chords
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
    
    // KEEP just one polling mechanism for checking show status
    let statusCheckInterval: number | undefined;
    let isPolling = false;
    
    // All users need to check if the show is still active, not just non-admins
    const checkShowStatus = async () => {
      if (isPolling) return; // Prevent overlapping calls
      
      try {
        isPolling = true;
        // Check if the show is still active
        const response = await axiosInstance.get<ShowDetails>(`/shows/${id}`);
        if (response.data.status !== 'active') {
          console.log('Show is no longer active, redirecting to dashboard');
          navigate('/main');
        }
      } catch (err) {
        // If there's an error (like 404), redirect to main
        console.log('Error checking show status, redirecting to dashboard');
        navigate('/main');
      } finally {
        isPolling = false;
      }
    };
    
    // Set a longer interval (7.5 seconds) to reduce API load
    statusCheckInterval = window.setInterval(checkShowStatus, 7500);
    
    // Cleanup intervals on unmount
    return () => {
      if (scrollIntervalId) {
        window.clearInterval(scrollIntervalId);
      }
      if (statusCheckInterval) {
        window.clearInterval(statusCheckInterval);
      }
    };
  }, [id, isAuthenticated, navigate, isAdmin]);

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
  
  // End the session (admin only) - now deletes the show instead of completing it
  const endSession = async () => {
    if (!show || !isAdmin) return;
    
    try {
      console.log('Admin deleting show:', show._id);
      setIsLoading(true);
      
      // Delete this specific show
      const response = await axiosInstance.delete(`/shows/${show._id}`);
      
      console.log('Show deleted successfully:', response.data);
      
      // Set a session storage flag to prevent immediate polling redirects
      sessionStorage.setItem('preventShowRedirect', 'true');
      
      // Also delete any other active shows to ensure clean state
      await axiosInstance.delete('/shows/delete-all');
      
      // Navigate immediately rather than waiting for polling
      navigate('/main');
      
      // Clear the flag after a delay to allow normal operation later
      setTimeout(() => {
        sessionStorage.removeItem('preventShowRedirect');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error ending session:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to end session');
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
        <Button variant="secondary" onClick={() => navigate('/main')}>
          Back to main
        </Button>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen font-assistant bg-[#f4f2ef] "
    >
      {/* Header */}
      <div className="p-4 top-0 z-10">
      <div className="container mx-auto grid grid-cols-3 items-center">
      <div></div>
      <p className="text-3xl lg:text-4xl text-[#e68c3a] font-semibold text-center">
      {show.song.title} by {show.song.artist} 
      </p>
          
          {isAdmin && (
            <Button variant='secondary' className='flex justify-end text-lg' onClick={endSession}>
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
            isAutoScrolling ? 'bg-red-800 hover:bg-red-900' : 'bg-gray-400 hover:bg-gray-500'
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