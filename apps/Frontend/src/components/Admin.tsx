import React from 'react';
import SongSearch from './SongSearch';

interface AdminProps {
  onSongSelected: (showId: string) => void;
}

const Admin: React.FC<AdminProps> = ({ onSongSelected }) => {
  // Admin component now just needs to handle the song search and navigation
  return (
    <div className="admin-container mt-8">
      <h1 className="text-3xl font-bold mb-6 text-[#516578]">Admin Dashboard</h1>
      
      {/* SongSearch will handle creating songs and shows */}
      <SongSearch onSongAdded={onSongSelected} />
    </div>
  );
};

export default Admin;