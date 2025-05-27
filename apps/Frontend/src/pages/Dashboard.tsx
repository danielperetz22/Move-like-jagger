import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Admin from '../components/Admin';
import Member from '../components/Member';

interface UserResponse {
  _id: string;
  username: string;
  email: string;
  admin: boolean;
  instrument: string;
}

interface ActiveShow { _id: string; }

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle song selection (for admin)
  const handleSongSelected = (showId: string) => {
    navigate(`/shows/${showId}`);
  };
  
  // Check if the user is authenticated and get their role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get<UserResponse>('/auth/me');
        setIsAdmin(response.data.admin);
        
        // If not admin, check for active session to redirect to
        if (!response.data.admin) {
          try {
            const activeSessionResponse = await axiosInstance.get<ActiveShow>('/shows/active');
            if (activeSessionResponse.data && activeSessionResponse.data._id) {
              // Redirect to the live page if there's an active session
              navigate(`/shows/${activeSessionResponse.data._id}`);
            }
          } catch (err) {
            // This is expected if there are no active sessions
            console.log('No active sessions found');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
    
    // Set up polling for members to check for active sessions
    let interval: number | undefined;
    
    if (isAuthenticated && !isAdmin) {
      interval = window.setInterval(async () => {
        try {
          const activeSessionResponse = await axiosInstance.get<ActiveShow>('/shows/active');
          if (activeSessionResponse.data && activeSessionResponse.data._id) {
            // Redirect to the live page if there's an active session
            navigate(`/shows/${activeSessionResponse.data._id}`);
          }
        } catch (err) {
          // Ignore errors, just keep polling
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isAuthenticated, navigate, isAdmin]);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {isAdmin ? (
        <Admin onSongSelected={handleSongSelected} />
      ) : (
        <Member />
      )}
    </div>
  );
};

export default Dashboard;