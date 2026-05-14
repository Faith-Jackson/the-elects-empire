import { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const TypedReactPlayer = ReactPlayer as any;
  const playerRef = useRef<any>(null);

  return (
    <div className="relative group aspect-video bg-black rounded-3xl overflow-hidden border border-white/10">
      <TypedReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        muted={muted}
        volume={volume}
        width="100%"
        height="100%"
        onProgress={(state: any) => setPlayed(state.played)}
        controls={false}
      />
      
      {/* Custom Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-white">
          <button onClick={() => setPlaying(!playing)}>
            {playing ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onChange={(e) => playerRef.current?.seekTo(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
          />

          <button onClick={() => setMuted(!muted)}>
            {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          
          <input
            type="range"
            min={0}
            max={1}
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
}
