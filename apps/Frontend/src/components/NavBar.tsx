import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuth } from '../context/authcontext';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation to login page is handled in the logout function
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="flex justify-between px-6 py-2 bg-gray-100">
      <div className="flex items-center">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <span className="text-2xl font-bold font-heebo text-[#516578]">JaMoveo</span>
        </div>
      </div>

      <div className="flex space-x-4">
        {isAuthenticated ? (
          <>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/music')}>
              Music
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;