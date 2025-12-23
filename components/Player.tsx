import React, { useEffect, useRef, useState } from 'react';
import { PlayMode, Story } from '../types';
import { formatTime } from '../utils/audio';
import { BACKGROUND_MUSIC_URL } from '../constants';

interface PlayerProps {
  currentStory: Story | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  playMode: PlayMode;
  onToggleMode: () => void;
  isBackgroundMusicOn: boolean;
  onToggleBgMusic: () => void;
}

const Player: React.FC<PlayerProps> = ({
  currentStory,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  playMode,
  onToggleMode,
  isBackgroundMusicOn,
  onToggleBgMusic
}) => {
  const [progress, setProgress] = useState(0);
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Handle Play/Pause Logic for Story Audio
  useEffect(() => {
    if (!storyAudioRef.current || !currentStory?.audioUrl) return;

    if (isPlaying) {
      storyAudioRef.current.play().catch(e => console.error("Playback failed:", e));
    } else {
      storyAudioRef.current.pause();
    }
  }, [isPlaying, currentStory]);

  // Reset when story changes
  useEffect(() => {
      setProgress(0);
      if (storyAudioRef.current) {
          storyAudioRef.current.currentTime = 0;
      }
  }, [currentStory?.id]);

  // Handle Background Music
  useEffect(() => {
    if (bgMusicRef.current) {
      if (isPlaying && isBackgroundMusicOn) {
        bgMusicRef.current.volume = 0.15; // Soft volume
        bgMusicRef.current.play().catch(e => console.log("Bg music interaction needed"));
      } else {
        bgMusicRef.current.pause();
      }
    }
  }, [isPlaying, isBackgroundMusicOn]);

  // Update Progress Bar
  useEffect(() => {
    const updateProgress = () => {
      if (isPlaying && storyAudioRef.current) {
        const currentTime = storyAudioRef.current.currentTime;
        const duration = storyAudioRef.current.duration || currentStory?.duration || 1;
        const percent = Math.min((currentTime / duration) * 100, 100);
        setProgress(percent);
        
        if (percent < 100) {
            rafRef.current = requestAnimationFrame(updateProgress);
        }
      }
    };

    if (isPlaying) {
        rafRef.current = requestAnimationFrame(updateProgress);
    } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, currentStory]);

  const handleStoryEnded = () => {
      onNext();
  };

  if (!currentStory) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-0 md:px-0 pointer-events-none flex justify-center">
      <audio ref={bgMusicRef} src={BACKGROUND_MUSIC_URL} loop />
      {/* Main Story Audio Element */}
      <audio 
        ref={storyAudioRef} 
        src={currentStory.audioUrl} 
        onEnded={handleStoryEnded}
        onPause={() => { if(isPlaying) onPlayPause(); }} // Sync external pause
        onPlay={() => { if(!isPlaying) onPlayPause(); }} // Sync external play
      />
      
      {/* Floating Card Player */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(66,32,6,0.1)] p-5 pointer-events-auto border border-[#FFF4E6] relative">
        
        {/* Progress Bar (Visual) */}
        <div className="absolute top-0 left-6 right-6 h-1 bg-orange-100 rounded-b-lg overflow-hidden">
            <div className="h-full bg-orange-400 transition-all duration-200" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex items-center gap-4 mt-2">
            
            {/* Play Button (Big Orange) */}
            <button 
                onClick={onPlayPause} 
                className="w-14 h-14 bg-[#FF9F76] text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} ml-1 text-xl`}></i>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#422006] truncate text-base">{currentStory.title}</h3>
                <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mt-0.5">
                    <span className="truncate max-w-[80px]">{currentStory.settings.mainCharacter}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="font-mono text-orange-400">{formatTime(currentStory.duration * (progress/100))}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                 <button onClick={onPrev} className="text-gray-300 hover:text-gray-500">
                    <i className="fas fa-backward-step"></i>
                </button>
                <button onClick={onNext} className="text-gray-300 hover:text-gray-500">
                    <i className="fas fa-forward-step"></i>
                </button>
            </div>
            
            {/* Toggle Bg Music */}
             <button 
                  onClick={onToggleBgMusic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isBackgroundMusicOn ? 'bg-teal-50 text-teal-500' : 'bg-gray-50 text-gray-300'}`}
                >
                    <i className="fas fa-music text-xs"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Player;