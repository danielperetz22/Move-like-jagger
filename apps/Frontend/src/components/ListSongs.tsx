import { type FC } from 'react';
import Button from './ui/Button';

interface ListSongsProps {
  songs: string[];             // "title by artist" strings
  onSelect: (full: string) => void;  // receives full string
}

const ListSongs: FC<ListSongsProps> = ({ songs, onSelect }) => {
  const count = songs.length;

  // always show count or no-results message
  const countLabel =
    count === 0
      ? 'No songs available with chords matching your search.'
      : count === 1
      ? '1 song available with chords matching your search.'
      : `${count} songs available with chords matching your search.`;

  return (
    <div className="mb-6">
      <p className="mb-2 font-semibold font-assistant text-2xl">{countLabel}</p>
      {count > 0 && (
        <div className="flex flex-wrap gap-2">
          {songs.map(full => (
            <Button
              key={full}
              variant="secondary"
              onClick={() => onSelect(full)}
            >
              {full}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListSongs;