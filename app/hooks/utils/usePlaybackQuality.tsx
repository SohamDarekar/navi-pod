import { createContext, useContext, useEffect, useState, useCallback } from "react";

export const PLAYBACK_QUALITY_KEY = "ipodPlaybackQuality";

export type PlaybackQuality = "raw" | "mp3" | "opus" | "aac";

export interface PlaybackQualityState {
  quality: PlaybackQuality;
  setQuality: (quality: PlaybackQuality) => void;
}

export const PlaybackQualityContext = createContext<PlaybackQualityState>({} as any);

export const usePlaybackQuality = (): PlaybackQualityState => {
  const state = useContext(PlaybackQualityContext);
  return { ...state };
};

interface Props {
  children: React.ReactNode;
}

export const PlaybackQualityProvider = ({ children }: Props) => {
  const [quality, setQualityState] = useState<PlaybackQuality>("raw");

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuality = localStorage.getItem(PLAYBACK_QUALITY_KEY) as PlaybackQuality | null;
      if (savedQuality && ["raw", "mp3", "opus", "aac"].includes(savedQuality)) {
        setQualityState(savedQuality);
      }
    }
  }, []);

  const setQuality = useCallback((newQuality: PlaybackQuality) => {
    setQualityState(newQuality);
    if (typeof window !== "undefined") {
      localStorage.setItem(PLAYBACK_QUALITY_KEY, newQuality);
    }
    // Dispatch event so audio player can react
    window.dispatchEvent(new CustomEvent("playback-quality-changed", { detail: newQuality }));
  }, []);

  return (
    <PlaybackQualityContext.Provider value={{ quality, setQuality }}>
      {children}
    </PlaybackQualityContext.Provider>
  );
};

export default usePlaybackQuality;
