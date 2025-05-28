import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import axiosInstance from '../axiosinstance';
import Member from '../components/Member';
import Button from '../components/ui/Button';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length > 0 && value.trim().length < 3) {
      setSearchError('Please enter at least 3 characters to search');
    } else {
      setSearchError('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim().length < 3) {
      setSearchError('Please enter at least 3 characters to search');
      return;
    }
    
    navigate(`/admin/results?query=${encodeURIComponent(searchQuery.trim())}`);
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

  // Set up polling specifically for non-admin users
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log('Setting up polling for active shows');
    
    const checkForActiveShow = async () => {
      try {
        const response = await axiosInstance.get<ActiveShow>('/shows/active');
        if (response.data && response.data._id) {
          console.log('Found active show, redirecting:', response.data._id);
          navigate(`/shows/${response.data._id}`);
        }
      } catch (err) {
        // No active shows, that's normal
      }
    };
    
    // Check immediately
    checkForActiveShow();
    
    // Then set up interval - this is important for BOTH admins and members
    // So they can be redirected to new shows that are created
    const intervalId = window.setInterval(checkForActiveShow, 3000); // Check every 3 seconds
    
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, navigate]);
  
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
          <div className="admin-container mt-8">
            <h1 className="text-3xl font-bold mb-6 text-[#516578]">Admin Main Page</h1>
            
            {/* Song Search Box */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#516578]">Search any song...</h2>
              <div className="search-container">
                <form onSubmit={handleSearch} className="flex flex-col space-y-2">
                  {searchError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2 text-sm">
                      <p>{searchError}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search (min 3 characters)"
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={searchQuery.trim().length < 3}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
      ) : (
        <Member />
      )}
    </div>
  );
};

export default Dashboard;