// LyricsDisplay.tsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosinstance';

interface Props {
  artist: string;
  title: string;
  showChords: boolean;
}

interface LyricsResponse {
  lyrics: string;
}

type ChordBlock = Array<{ lyrics: string; chords?: string }>;

const LyricsDisplay: React.FC<Props> = ({ artist, title , showChords }) => {
  const [blocks, setBlocks] = useState<ChordBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(false);

  // normalize chord strings
  function clean(ch: string) {
    return ch.replace(',,','').replace(/,/g,'');
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // fetch rawLyrics (we only need it to split into blocks if fallback)
        const { data: { lyrics } } = await axiosInstance.get<LyricsResponse>(
          `/lyrics/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        );

        // next, fetch your chord–lyrics blocks
        const { data: fetched } = await axiosInstance.get<ChordBlock[]>(
          `/chords/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        );

        let blocksData: ChordBlock[];
        if (Array.isArray(fetched) && fetched.length > 0) {
          // clean up chord strings
          blocksData = fetched.map(block =>
            block.map(tok => ({
              lyrics: tok.lyrics,
              chords: tok.chords ? clean(tok.chords) : undefined
            }))
          );
        } else {
          // fallback: split lyrics by line, then each line into one big block
          const lines = lyrics.split(/\r?\n/);
          blocksData = lines.map(line => [ { lyrics: line } ]);
        }

        setBlocks(blocksData);

        const hasHebrew = blocksData.some(block =>
          block.some(tok => /[\u0590-\u05FF]/.test(tok.lyrics))
        );
        setIsRTL(hasHebrew);

      } catch (e) {
        console.error(e);
        setError('Failed to load lyrics or chords');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [artist, title]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>;
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-gray-800 text-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-semibold mb-4 text-blue-300">
        {artist} – {title}
      </h3>

      <div className="space-y-4">
        {blocks.map((block, i) => (
          <div key={i}>
          {/* only show this line if the user is allowed chords */}
            {showChords && (
              <div className="flex flex-wrap mb-1">
                {block.map((tok, j) => (
                  <span
                    key={j}
                    className="inline-block mx-1 text-blue-300 font-semibold"
                    style={{ minWidth: '2ch', textAlign: 'center' }}
                  >
                    {tok.chords ?? '\u00A0'}
                  </span>
                ))}
              </div>
            )}

            {/* lyric line */}
            <div className="flex flex-wrap">
              {block.map((tok, j) => (
                <span
                  key={j}
                  className="inline-block mx-1"
                  style={{ minWidth: '2ch', textAlign: 'center' }}
                >
                  {tok.lyrics}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricsDisplay;
