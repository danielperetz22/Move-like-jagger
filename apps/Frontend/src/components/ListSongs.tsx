import React, { type FC } from 'react';
import Button from './ui/Button';

interface ListSongsProps {
  songs: string[];             
  onSelect: (full: string) => void;  
}

const ListSongs: FC<ListSongsProps> = ({ songs, onSelect }) => {
  return (
    <div className="font-assistant">
      <p className="mb-4 font-semibold text-[#e68c3a] text-xl md:text-2xl lg:text-3xl">
        Available songs with chords matching your search:
      </p>
      {songs.length > 0 ? (
        <div className="mt-4 w-full">
          <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {songs.map((full, index) => (
              <React.Fragment key={index}>
                {index > 0 && <div className="h-px bg-gray-200 w-full"></div>}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onSelect(full)}
                  className="py-3 px-4 text-left hover:bg-gray-50 transition-colors w-full text-sm md:text-base"
                >
                  {full}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic">No songs available with chords matching your search.</p>
      )}
    </div>
  );
};

export default ListSongs;