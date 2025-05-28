import React from 'react';

const Member: React.FC = () => {
  // REMOVE the polling here - it's already handled by the Dashboard component
  // This prevents duplicate polling
  
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h1 className="text-3xl font-bold mb-4 text-[#516578]">Waiting for next song</h1>
      <p className="text-gray-600 mb-8">The admin will select a song soon...</p>
      <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
    </div>
  );
};

export default Member;
