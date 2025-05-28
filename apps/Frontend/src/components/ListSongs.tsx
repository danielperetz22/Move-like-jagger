import { type FC } from 'react';
import Button from './ui/Button';

interface ListSongsProps {
  songs: string[];             
  onSelect: (full: string) => void;  
}

const ListSongs: FC<ListSongsProps> = ({ songs, onSelect }) => {
  return (
    <div className="mb-6 font-assistant">
      <p className="mb-2 font-semibold  text-2xl">
        Available songs with chords matching your search:
      </p>
      {songs.length > 0 ? (
        <div className="flex flex-col space-y-2">
          {songs.map(full => (
            <Button
              key={full}
              variant="secondary"
              onClick={() => {
                const [title] = full.split(' by ');
                onSelect(title.trim());
              }}
            >
              {full}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No songs available with chords matching your search.</p>
      )}
    </div>
  );
};

export default ListSongs;