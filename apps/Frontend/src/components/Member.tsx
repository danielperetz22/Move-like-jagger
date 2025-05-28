import React from 'react';

const Member: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4f2ef] flex flex-col items-center py-48">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-[#e68c3a]">
            Waiting for Live Session
          </h1>
          <p className="text-gray-600">
            The host is preparing the next song...
          </p>
        </div>
        
        {/* Improved loading animation */}
        <div className="flex justify-center my-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-t-[#60212e] border-[#f4f2ef] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-[#e68c3a] border-[#f4f2ef] rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 italic">
          You'll be automatically redirected when the session begins
        </p>
      </div>
    </div>
  );
};

export default Member;