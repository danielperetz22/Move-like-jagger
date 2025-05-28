import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuth } from '../context/authcontext';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    navigate('/login');
  };

  return (
    <nav className="bg-[#f4f2ef] px-6 py-2">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <span className="text-3xl font-extrabold font-heebo text-[#b8a99d]">
            JaMoveo
          </span>
        </div>
        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 focus:outline-none"
          >
            <svg 
              className="h-6 w-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
        <div className="hidden md:flex space-x-4">
          {isAuthenticated ? (
            <>
              <Button variant="primary" onClick={() => navigate('/main')}>
                Main
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="secondary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden mt-2`}>
        <div className="flex flex-col space-y-2">
          {isAuthenticated ? (
            <>
              <Button variant="primary" onClick={() => { setIsOpen(false); navigate('/main')}}>
                Main
              </Button>
              <Button variant="secondary" onClick={() => { setIsOpen(false); handleLogout() }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => { setIsOpen(false); navigate('/login')}}>
                Login
              </Button>
              <Button variant="secondary" onClick={() => { setIsOpen(false); navigate('/register')}}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;