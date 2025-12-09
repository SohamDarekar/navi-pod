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

  // Refs for the auto-advance callback to avoid stale closures
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const nowPlayingItemRef = useRef(nowPlayingItem);
  const playTrackRef = useRef<((song: MediaApi.Song) => Promise<void>) | undefined>(undefined);
  
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

      // Load saved volume
      const savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? "0.5");
      audioRef.current.volume = savedVolume;
      setVolumeState(savedVolume);
      
      // Load saved loop state
      const savedLoop = localStorage.getItem(LOOP_KEY) === "true";
      setIsLooping(savedLoop);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
    };
  }, []);

  // ------------------------------------------------------------------------
  // OPTIMIZATION: Debounced Preloading
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (queue.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    const audioPreloaders: HTMLAudioElement[] = [];

    const startPreload = () => {
      const preloadCount = 2;

      for (let i = 1; i <= preloadCount; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < queue.length) {
          const nextSong = queue[nextIndex];
          const streamUrl = getStreamUrl(nextSong.id);
          
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

    // Wait 2000ms before hitting the network/CPU
    timeoutId = setTimeout(startPreload, 2000);

    return () => {
      clearTimeout(timeoutId);
      audioPreloaders.forEach((audio) => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load(); 
      });
    };
  }, [queue, currentIndex]);

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
            { src: getArtworkForSize(baseUrl, 384), sizes: "384x384", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 512), sizes: "512x512", type: "image/jpeg" },
            { src: getArtworkForSize(baseUrl, 2048), sizes: "2048x2048", type: "image/jpeg" },
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

      const streamUrl = getStreamUrl(song.id);
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
      
      try {
        await audio.play();
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to play audio:", error);
        }
      }
    },
    [updateMediaSession]
  );

  // Sync the ref with the function
  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setPlaybackInfo((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        isLoading: false,
      }));
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    };

    const handlePause = () => {
      setPlaybackInfo((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    };

    const handleLoadStart = () => {
      setPlaybackInfo((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setPlaybackInfo((prev) => ({ ...prev, isLoading: false }));
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 0;
      const timeRemaining = duration - currentTime;
      const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

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

      setPlaybackInfo((prev) => ({
        ...prev,
        currentTime,
        timeRemaining,
        percent,
        duration,
      }));
    };

    const handleEnded = () => {
      const completedItem = nowPlayingItemRef.current;
      if (completedItem) {
        scrobble(completedItem.id).catch(console.error);
      }
      
      // Check if looping is enabled
      const savedLoop = localStorage.getItem(LOOP_KEY) === "true";
      if (savedLoop && audio) {
        // Loop the current song
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      
      const currentQueue = queueRef.current;
      const idx = currentIndexRef.current;
      
      if (currentQueue.length === 0) return;

      // Logic to remove the played song from queue
      if (idx < currentQueue.length - 1) {
        const nextSong = currentQueue[idx + 1];
        
        // Remove the played song from the queue
        const newQueue = [...currentQueue];
        newQueue.splice(idx, 1);
        setQueue(newQueue);
        
        // Update currentIndex to maintain proper state tracking
        // Even though the numeric value stays the same, this ensures React recognizes the state change
        setCurrentIndex(idx);
        
        // Play the next song (which has now shifted into the current index position)
        playTrackRef.current?.(nextSong);
      } else {
        setPlaybackInfo((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
        }));
        // Remove the last song as well to clear the queue
        const newQueue = [...currentQueue];
        newQueue.splice(idx, 1);
        setQueue(newQueue);
        // Ensure index doesn't stay out of bounds
        setCurrentIndex(Math.max(0, newQueue.length - 1));
      }
    };

    const handleError = (e: Event) => {
      if (audio.src && audio.src !== window.location.href) {
        console.error("Audio playback error:", e);
      }
      setPlaybackInfo((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
      }));
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
    };
  }, []);

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
      if (songs.length === 0) return;

      const startPosition = queueOptions.startPosition ?? 0;
      setQueue(songs);
      setCurrentIndex(startPosition);

      // Force play the new track
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

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  }, [nowPlayingItem]);

  const skipNext = useCallback(async () => {
    if (!nowPlayingItem || queue.length === 0) return;

    // Use current state for decision making
    if (currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1];
      
      // Remove current song from queue
      const newQueue = [...queue];
      newQueue.splice(currentIndex, 1);
      setQueue(newQueue);
      
      // Play next (which shifted into currentIndex)
      await playTrack(nextSong);
    }
  }, [currentIndex, nowPlayingItem, playTrack, queue]);

  const skipPrevious = useCallback(async () => {
    if (!nowPlayingItem || queue.length === 0) return;

    const audio = audioRef.current;

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      await playTrack(queue[prevIndex]);
    }
  }, [currentIndex, nowPlayingItem, playTrack, queue]);

  const seekToTime = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
    localStorage.setItem(VOLUME_KEY, `${newVolume}`);
    setVolumeState(newVolume);
  }, []);

  const toggleLoop = useCallback(() => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    localStorage.setItem(LOOP_KEY, `${newLoopState}`);
  }, [isLooping]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prevQueue) => {
      if (index < 0 || index >= prevQueue.length) return prevQueue;
      
      const newQueue = [...prevQueue];
      newQueue.splice(index, 1);
      
      // Adjust currentIndex if necessary
      setCurrentIndex((prevIndex) => {
        if (index < prevIndex) {
          // Song removed before current: shift index down
          return prevIndex - 1;
        } else if (index === prevIndex) {
          // Current song removed: stay at same index (next song moves into place)
          // If we're at the end, move back one
          return prevIndex >= newQueue.length ? Math.max(0, newQueue.length - 1) : prevIndex;
        }
        // Song removed after current: no change needed
        return prevIndex;
      });
      
      return newQueue;
    });
  }, []);

  const updateNowPlayingItem = useCallback(() => {}, []);

  const updatePlaybackInfo = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;
    const timeRemaining = duration - currentTime;
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

    setPlaybackInfo((prev) => ({
      ...prev,
      currentTime,
      timeRemaining,
      percent,
      duration,
    }));
  }, []);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
      navigator.mediaSession.setActionHandler("pause", () => pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => skipPrevious());
      navigator.mediaSession.setActionHandler("nexttrack", () => skipNext());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          seekToTime(details.seekTime);
        }
      });
    }
  }, [togglePlayPause, pause, skipPrevious, skipNext, seekToTime]);

  useEventListener<IpodEvent>("playpauseclick", togglePlayPause);
  useEventListener<IpodEvent>("forwardclick", skipNext);
  useEventListener<IpodEvent>("backwardclick", skipPrevious);

  const contextValue = useMemo(() => ({
    playbackInfo,
    nowPlayingItem,
    volume,
    queue,
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
  }), [
    playbackInfo,
    nowPlayingItem,
    volume,
    queue,
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
  ]);

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default useAudioPlayer;