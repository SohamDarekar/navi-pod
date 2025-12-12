import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";

import { useEventListener } from "hooks";
import { IpodEvent } from "utils/events";
import {
  getStreamUrl,
  getCoverArtUrl,
  nowPlaying as reportNowPlaying,
  scrobble,
  isAuthenticated,
} from "utils/navidrome/client";
import { PLAYBACK_QUALITY_KEY } from "hooks/utils/usePlaybackQuality";
import type { PlaybackQuality } from "hooks/utils/usePlaybackQuality";
import { FADE_IN_KEY, FADE_OUT_KEY } from "hooks/utils/useFadeSettings";
import type { FadeDuration } from "hooks/utils/useFadeSettings";

export const VOLUME_KEY = "ipodVolume";
export const LOOP_KEY = "ipodLoop";

const defaultPlaybackInfoState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentTime: 0,
  timeRemaining: 0,
  percent: 0,
  duration: 0,
};

interface AudioPlayerState {
  playbackInfo: typeof defaultPlaybackInfoState;
  nowPlayingItem?: MediaApi.MediaItem;
  volume: number;
  queue: MediaApi.Song[];
  currentIndex: number; // <--- THIS IS REQUIRED FOR QUEUE VIEW
  isLooping: boolean;
  play: (queueOptions: MediaApi.QueueOptions) => Promise<void>;
  playNext: (queueOptions: MediaApi.QueueOptions) => Promise<void>;
  addToQueue: (queueOptions: MediaApi.QueueOptions) => Promise<void>;
  pause: () => Promise<void>;
  seekToTime: (time: number) => void;
  setVolume: (volume: number) => void;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  toggleLoop: () => void;
  updateNowPlayingItem: () => void;
  updatePlaybackInfo: () => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export const AudioPlayerContext = createContext<AudioPlayerState>({} as any);

type AudioPlayerHook = AudioPlayerState;

export const useAudioPlayer = (): AudioPlayerHook => {
  const state = useContext(AudioPlayerContext);
  return { ...state };
};

interface Props {
  children: React.ReactNode;
}

export const AudioPlayerProvider = ({ children }: Props) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [isLooping, setIsLooping] = useState(false);
  const [nowPlayingItem, setNowPlayingItem] = useState<MediaApi.MediaItem>();
  const [playbackInfo, setPlaybackInfo] = useState(defaultPlaybackInfoState);
  const [queue, setQueue] = useState<MediaApi.Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackQuality, setPlaybackQuality] = useState<PlaybackQuality>("raw");
  const [fadeInDuration, setFadeInDuration] = useState<FadeDuration>(0);
  const [fadeOutDuration, setFadeOutDuration] = useState<FadeDuration>(0);
  
  const fadeInIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalVolumeRef = useRef<number>(0.5);
  const fadeOutStartedRef = useRef<boolean>(false);
  const currentTrackIdRef = useRef<string | null>(null);

  // Refs for callbacks to avoid stale closures
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const nowPlayingItemRef = useRef(nowPlayingItem);
  const playTrackRef = useRef<((song: MediaApi.Song) => Promise<void>) | undefined>(undefined);
  // Ref for throttling time updates
  const lastUpdateTimeRef = useRef(0);
  
  // Keep refs in sync
  useEffect(() => {
    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    nowPlayingItemRef.current = nowPlayingItem;
  }, [queue, currentIndex, nowPlayingItem]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";

      const savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "0.5");
      audioRef.current.volume = savedVolume;
      setVolumeState(savedVolume);
      
      const savedLoop = localStorage.getItem(LOOP_KEY) === "true";
      setIsLooping(savedLoop);
      
      const savedQuality = (localStorage.getItem(PLAYBACK_QUALITY_KEY) as PlaybackQuality) ?? "raw";
      setPlaybackQuality(savedQuality);
      
      const savedFadeIn = localStorage.getItem(FADE_IN_KEY);
      const savedFadeOut = localStorage.getItem(FADE_OUT_KEY);
      if (savedFadeIn) setFadeInDuration(parseInt(savedFadeIn) as FadeDuration);
      if (savedFadeOut) setFadeOutDuration(parseInt(savedFadeOut) as FadeDuration);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
    };
  }, []);

  // Listen for playback quality changes
  useEffect(() => {
    const handleQualityChange = (event: Event) => {
      const customEvent = event as CustomEvent<PlaybackQuality>;
      if (customEvent.detail) {
        setPlaybackQuality(customEvent.detail);
        // If currently playing, reload with new quality
        const audio = audioRef.current;
        const currentSong = queue[currentIndex];
        if (audio && currentSong && nowPlayingItem) {
          const wasPlaying = !audio.paused;
          const currentTime = audio.currentTime;
          const newStreamUrl = getStreamUrl(currentSong.id, customEvent.detail);
          audio.src = newStreamUrl;
          audio.currentTime = currentTime;
          if (wasPlaying) {
            audio.play().catch(console.error);
          }
        }
      }
    };

    window.addEventListener("playback-quality-changed", handleQualityChange);
    return () => window.removeEventListener("playback-quality-changed", handleQualityChange);
  }, [queue, currentIndex, nowPlayingItem]);

  // Listen for fade settings changes
  useEffect(() => {
    const handleFadeInChange = (event: Event) => {
      const customEvent = event as CustomEvent<FadeDuration>;
      if (customEvent.detail !== undefined) {
        setFadeInDuration(customEvent.detail);
      }
    };

    const handleFadeOutChange = (event: Event) => {
      const customEvent = event as CustomEvent<FadeDuration>;
      if (customEvent.detail !== undefined) {
        setFadeOutDuration(customEvent.detail);
      }
    };

    window.addEventListener("fade-in-changed", handleFadeInChange);
    window.addEventListener("fade-out-changed", handleFadeOutChange);
    return () => {
      window.removeEventListener("fade-in-changed", handleFadeInChange);
      window.removeEventListener("fade-out-changed", handleFadeOutChange);
    };
  }, []);

  // Fade in/out helper functions
  const applyFadeIn = useCallback((audio: HTMLAudioElement, duration: FadeDuration, targetVolume: number) => {
    if (duration === 0) {
      audio.volume = targetVolume;
      return;
    }

    audio.volume = 0;
    const steps = 50;
    const stepDuration = (duration * 1000) / steps;
    const volumeIncrement = targetVolume / steps;
    let currentStep = 0;

    if (fadeInIntervalRef.current) {
      clearInterval(fadeInIntervalRef.current);
    }

    fadeInIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        if (fadeInIntervalRef.current) {
          clearInterval(fadeInIntervalRef.current);
          fadeInIntervalRef.current = null;
        }
      } else {
        audio.volume = Math.min(volumeIncrement * currentStep, targetVolume);
      }
    }, stepDuration);
  }, []);

  const applyFadeOut = useCallback((audio: HTMLAudioElement, duration: FadeDuration, callback: () => void) => {
    if (duration === 0) {
      callback();
      return;
    }

    const startVolume = audio.volume;
    const steps = 50;
    const stepDuration = (duration * 1000) / steps;
    const volumeDecrement = startVolume / steps;
    let currentStep = 0;

    if (fadeOutIntervalRef.current) {
      clearInterval(fadeOutIntervalRef.current);
    }

    fadeOutIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = 0;
        if (fadeOutIntervalRef.current) {
          clearInterval(fadeOutIntervalRef.current);
          fadeOutIntervalRef.current = null;
        }
        callback();
      } else {
        audio.volume = Math.max(startVolume - volumeDecrement * currentStep, 0);
      }
    }, stepDuration);
  }, []);

  // Preloading Logic
  useEffect(() => {
    if (queue.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    const audioPreloaders: HTMLAudioElement[] = [];

    const startPreload = () => {
      // Preload next 2 songs
      for (let i = 1; i <= 2; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < queue.length) {
          const nextSong = queue[nextIndex];
          const streamUrl = getStreamUrl(nextSong.id, playbackQuality);
          
          if (streamUrl) {
            const audio = new Audio();
            audio.src = streamUrl;
            audio.preload = "auto";
            audio.load();
            audioPreloaders.push(audio);
          }
        }
      }
    };

    timeoutId = setTimeout(startPreload, 2000);

    return () => {
      clearTimeout(timeoutId);
      audioPreloaders.forEach((audio) => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load(); 
      });
    };
  }, [queue, currentIndex, playbackQuality]);

  const getArtworkForSize = (url: string, size: number) => {
    if (!url) return "";
    if (url.includes("size=")) {
      return url.replace(/size=\d+/, `size=${size}`);
    }
    return url.replace("{w}", `${size}`).replace("{h}", `${size}`);
  };

  const updateMediaSession = useCallback((item: MediaApi.MediaItem) => {
    if ("mediaSession" in navigator) {
      const baseUrl = item.artwork?.url;
      const artwork = baseUrl
        ? [
            { src: getArtworkForSize(baseUrl, 96), sizes: "96x96", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 128), sizes: "128x128", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 192), sizes: "192x192", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 256), sizes: "256x256", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 512), sizes: "512x512", type: "image/jpeg" },
          ]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.name,
        artist: item.artistName,
        album: item.albumName,
        artwork,
      });

      navigator.mediaSession.playbackState = "playing";
    }
  }, []);

  const playTrack = useCallback(
    async (song: MediaApi.Song) => {
      const audio = audioRef.current;
      if (!audio || !isAuthenticated()) return;

      const streamUrl = getStreamUrl(song.id, playbackQuality);
      if (!streamUrl) return;

      const artworkUrl = song.artwork?.url || getCoverArtUrl(song.id);

      const mediaItem: MediaApi.MediaItem = {
        ...song,
        artwork: { url: artworkUrl },
      };

      setNowPlayingItem(mediaItem);
      updateMediaSession(mediaItem);

      reportNowPlaying(song.id).catch(console.error);

      audio.src = streamUrl;
      
      // Store the target volume and reset fade-out tracking
      // Use the volume state instead of audio.volume to avoid capturing 0 from previous fade-out
      originalVolumeRef.current = volume;
      fadeOutStartedRef.current = false;
      currentTrackIdRef.current = song.id;
      
      // Clear any existing fade intervals
      if (fadeInIntervalRef.current) {
        clearInterval(fadeInIntervalRef.current);
        fadeInIntervalRef.current = null;
      }
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
        fadeOutIntervalRef.current = null;
      }
      
      try {
        await audio.play();
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to play audio:", error);
        }
      }
    },
    [updateMediaSession, playbackQuality, volume]
  );

  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setPlaybackInfo((prev) => ({ ...prev, isPlaying: true, isPaused: false, isLoading: false }));
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
      
      // Apply fade-in when playback actually starts
      if (fadeInDuration > 0 && !fadeOutStartedRef.current) {
        applyFadeIn(audio, fadeInDuration, originalVolumeRef.current);
      } else if (fadeInDuration === 0) {
        // Ensure volume is set correctly when no fade-in
        audio.volume = originalVolumeRef.current;
      }
    };

    const handlePause = () => {
      setPlaybackInfo((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    };

    const handleLoadStart = () => setPlaybackInfo((prev) => ({ ...prev, isLoading: true }));
    const handleCanPlay = () => setPlaybackInfo((prev) => ({ ...prev, isLoading: false }));

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 0;
      
      if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: audio.playbackRate,
            position: currentTime,
          });
        } catch (error) {
          // Ignore errors
        }
      }

      // Throttle updates to ~1 second
      const now = Date.now();
      if (now - lastUpdateTimeRef.current > 1000 || (duration > 0 && currentTime === duration)) {
        const timeRemaining = duration - currentTime;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

        setPlaybackInfo((prev) => ({
          ...prev,
          currentTime,
          timeRemaining,
          percent,
          duration,
        }));
        lastUpdateTimeRef.current = now;
      }
      
      // Check if we need to start fade-out
      if (fadeOutDuration > 0 && duration > fadeOutDuration && !fadeOutStartedRef.current) {
        const fadeOutStartTime = duration - fadeOutDuration;
        // Only start fade-out if we're within the fade-out window and fade-in is complete
        if (currentTime >= fadeOutStartTime && currentTime < duration - 0.5 && !fadeInIntervalRef.current) {
          fadeOutStartedRef.current = true;
          // Use original volume as the starting point for fade-out
          audio.volume = originalVolumeRef.current;
          applyFadeOut(audio, fadeOutDuration, () => {});
        }
      }
    };

    const handleEnded = () => {
      const completedItem = nowPlayingItemRef.current;
      if (completedItem) scrobble(completedItem.id).catch(console.error);
      
      const savedLoop = localStorage.getItem(LOOP_KEY) === "true";
      if (savedLoop && audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      
      const currentQueue = queueRef.current;
      const idx = currentIndexRef.current;
      
      // FIXED: Increment index instead of splicing
      if (currentQueue.length > 0 && idx < currentQueue.length - 1) {
        const nextIndex = idx + 1;
        setCurrentIndex(nextIndex);
        playTrackRef.current?.(currentQueue[nextIndex]);
      } else {
        setPlaybackInfo((prev) => ({ ...prev, isPlaying: false, isPaused: true, currentTime: 0, percent: 0 }));
      }
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setPlaybackInfo((prev) => ({ ...prev, isLoading: false, isPlaying: false }));
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      
      // Clear fade intervals on unmount
      if (fadeInIntervalRef.current) {
        clearInterval(fadeInIntervalRef.current);
      }
      if (fadeOutIntervalRef.current) {
        clearInterval(fadeOutIntervalRef.current);
      }
    };
  }, [fadeInDuration, fadeOutDuration, applyFadeIn, applyFadeOut]);

  const extractSongs = (queueOptions: MediaApi.QueueOptions): MediaApi.Song[] => {
    if (queueOptions.album?.songs) return queueOptions.album.songs;
    if (queueOptions.playlist?.songs) return queueOptions.playlist.songs;
    if (queueOptions.songs) return queueOptions.songs;
    if (queueOptions.song) return [queueOptions.song];
    return [];
  };

  const play = useCallback(
    async (queueOptions: MediaApi.QueueOptions) => {
      if (!isAuthenticated()) return;
      
      const songs = extractSongs(queueOptions);
      if (!songs || songs.length === 0) return;

      const startPosition = queueOptions.startPosition ?? 0;
      
      setQueue(songs);
      setCurrentIndex(startPosition);

      await playTrack(songs[startPosition]);
    },
    [playTrack]
  );

  const playNext = useCallback(
    async (queueOptions: MediaApi.QueueOptions) => {
      if (!isAuthenticated()) return;

      const songs = extractSongs(queueOptions);
      if (songs.length === 0) return;

      if (queue.length === 0) {
        await play(queueOptions);
        return;
      }

      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        // Fixed: Use safe insert
        newQueue.splice(currentIndex + 1, 0, ...songs);
        return newQueue;
      });
    },
    [play, queue.length, currentIndex]
  );

  const addToQueue = useCallback(
    async (queueOptions: MediaApi.QueueOptions) => {
      if (!isAuthenticated()) return;
      const songs = extractSongs(queueOptions);
      if (songs.length === 0) return;

      if (queue.length === 0) {
        await play(queueOptions);
        return;
      }
      setQueue((prevQueue) => [...prevQueue, ...songs]);
    },
    [play, queue.length]
  );

  const pause = useCallback(async () => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !nowPlayingItem) return;
    audio.paused ? await audio.play() : audio.pause();
  }, [nowPlayingItem]);

  const skipNext = useCallback(async () => {
    if (!nowPlayingItem || queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      await playTrack(queue[nextIndex]);
    }
  }, [currentIndex, nowPlayingItem, playTrack, queue]);

  const skipPrevious = useCallback(async () => {
    if (!nowPlayingItem || queue.length === 0) return;
    const audio = audioRef.current;

    // Restart song if > 3s played
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await playTrack(queue[prevIndex]);
    } else if (audio) {
      audio.currentTime = 0;
    }
  }, [currentIndex, nowPlayingItem, playTrack, queue]);

  const seekToTime = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setPlaybackInfo(prev => ({...prev, currentTime: time}));
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    audioRef.current && (audioRef.current.volume = newVolume);
    localStorage.setItem(VOLUME_KEY, `${newVolume}`);
    setVolumeState(newVolume);
    originalVolumeRef.current = newVolume;
  }, []);

  const toggleLoop = useCallback(() => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    localStorage.setItem(LOOP_KEY, `${newLoopState}`);
  }, [isLooping]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      newQueue.splice(index, 1);
      
      setCurrentIndex((prevIndex) => {
        if (index < prevIndex) return prevIndex - 1;
        return prevIndex;
      });
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setNowPlayingItem(undefined);
    audioRef.current?.pause();
  }, []);

  const updateNowPlayingItem = useCallback(() => {}, []);
  const updatePlaybackInfo = useCallback(() => {}, []);

  useEventListener<IpodEvent>("playpauseclick", togglePlayPause);
  useEventListener<IpodEvent>("forwardclick", skipNext);
  useEventListener<IpodEvent>("backwardclick", skipPrevious);

  const contextValue = useMemo(() => ({
    playbackInfo,
    nowPlayingItem,
    volume,
    queue,
    currentIndex, // <--- EXPOSED CORRECTLY
    isLooping,
    play,
    playNext,
    addToQueue,
    pause,
    seekToTime,
    setVolume,
    togglePlayPause,
    toggleLoop,
    updateNowPlayingItem,
    updatePlaybackInfo,
    skipNext,
    skipPrevious,
    removeFromQueue,
    clearQueue,
  }), [
    playbackInfo, nowPlayingItem, volume, queue, currentIndex, isLooping,
    play, playNext, addToQueue, pause, seekToTime, setVolume, togglePlayPause,
    toggleLoop, updateNowPlayingItem, updatePlaybackInfo, skipNext, skipPrevious,
    removeFromQueue, clearQueue
  ]);

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default useAudioPlayer;