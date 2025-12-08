/**
 * NaviPod - Navidrome Type Definitions
 * Subsonic API compatible types for Navidrome integration
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface NaviSong {
  id: string;
  title: string;
  album: string;
  albumId: string;
  artist: string;
  artistId: string;
  track: number;
  year?: number;
  genre?: string;
  duration: number; // in seconds
  bitRate?: number;
  size?: number;
  suffix?: string;
  contentType?: string;
  path?: string;
  coverArt?: string;
  created?: string;
  starred?: string;
  playCount?: number;
  discNumber?: number;
  // Computed URLs (populated by client)
  streamUrl?: string;
  artworkUrl?: string;
}

export interface NaviAlbum {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  coverArt?: string;
  songCount: number;
  duration: number; // total duration in seconds
  year?: number;
  genre?: string;
  created?: string;
  starred?: string;
  playCount?: number;
  songs?: NaviSong[];
  // Computed URLs (populated by client)
  artworkUrl?: string;
}

export interface NaviArtist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
  albums?: NaviAlbum[];
  // Computed URLs (populated by client)
  artworkUrl?: string;
}

export interface NaviPlaylist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number; // total duration in seconds
  created?: string;
  changed?: string;
  coverArt?: string;
  songs?: NaviSong[];
  // Computed URLs (populated by client)
  artworkUrl?: string;
}

// ============================================================================
// Subsonic API Response Types
// ============================================================================

export interface SubsonicResponse<T = unknown> {
  "subsonic-response": {
    status: "ok" | "failed";
    version: string;
    type?: string;
    serverVersion?: string;
    error?: SubsonicError;
  } & T;
}

export interface SubsonicError {
  code: number;
  message: string;
}

// Response payload types
export interface ArtistsResponse {
  artists: {
    index: ArtistIndex[];
    ignoredArticles?: string;
  };
}

export interface ArtistIndex {
  name: string;
  artist: SubsonicArtist[];
}

export interface SubsonicArtist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
}

export interface ArtistResponse {
  artist: SubsonicArtist & {
    album: SubsonicAlbum[];
  };
}

export interface AlbumListResponse {
  albumList2: {
    album: SubsonicAlbum[];
  };
}

export interface AlbumResponse {
  album: SubsonicAlbum & {
    song: SubsonicSong[];
  };
}

export interface SubsonicAlbum {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  year?: number;
  genre?: string;
  created?: string;
  starred?: string;
  playCount?: number;
}

export interface SubsonicSong {
  id: string;
  title: string;
  album: string;
  albumId: string;
  artist: string;
  artistId: string;
  track: number;
  year?: number;
  genre?: string;
  duration: number;
  bitRate?: number;
  size?: number;
  suffix?: string;
  contentType?: string;
  path?: string;
  coverArt?: string;
  created?: string;
  starred?: string;
  playCount?: number;
  discNumber?: number;
}

export interface PlaylistsResponse {
  playlists: {
    playlist: SubsonicPlaylist[];
  };
}

export interface PlaylistResponse {
  playlist: SubsonicPlaylist & {
    entry: SubsonicSong[];
  };
}

export interface SubsonicPlaylist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number;
  created?: string;
  changed?: string;
  coverArt?: string;
}

export interface SearchResult3Response {
  searchResult3: {
    artist?: SubsonicArtist[];
    album?: SubsonicAlbum[];
    song?: SubsonicSong[];
  };
}

export interface RandomSongsResponse {
  randomSongs: {
    song: SubsonicSong[];
  };
}

export interface NowPlayingResponse {
  nowPlaying: {
    entry?: SubsonicSong[];
  };
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface NavidromeCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface NavidromeAuthParams {
  u: string; // username
  t: string; // MD5(password + salt)
  s: string; // salt
  v: string; // API version
  c: string; // client name
  f: string; // format (json)
}

// ============================================================================
// MediaApi Compatible Types (for UI compatibility)
// ============================================================================

export function toMediaApiSong(song: NaviSong): MediaApi.Song {
  return {
    id: song.id,
    name: song.title,
    albumName: song.album,
    artistName: song.artist,
    duration: song.duration * 1000, // Convert to milliseconds for UI
    trackNumber: song.track,
    url: song.streamUrl || "",
    artwork: song.artworkUrl ? { url: song.artworkUrl } : undefined,
  };
}

export function toMediaApiAlbum(album: NaviAlbum): MediaApi.Album {
  return {
    id: album.id,
    name: album.name,
    artistName: album.artist,
    url: "",
    artwork: album.artworkUrl ? { url: album.artworkUrl } : undefined,
    songs: album.songs?.map(toMediaApiSong) || [],
  };
}

export function toMediaApiArtist(artist: NaviArtist): MediaApi.Artist {
  return {
    id: artist.id,
    name: artist.name,
    url: "",
    artwork: artist.artworkUrl ? { url: artist.artworkUrl } : undefined,
    albums: artist.albums?.map(toMediaApiAlbum),
  };
}

export function toMediaApiPlaylist(playlist: NaviPlaylist): MediaApi.Playlist {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.comment,
    curatorName: playlist.owner || "",
    url: "",
    artwork: playlist.artworkUrl ? { url: playlist.artworkUrl } : undefined,
    songs: playlist.songs?.map(toMediaApiSong) || [],
  };
}

// ============================================================================
// Library Sync Types
// ============================================================================

export interface LibrarySyncState {
  lastSyncTime: number | null;
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  error: string | null;
}

export interface CachedLibrary {
  artists: NaviArtist[];
  albums: NaviAlbum[];
  songs: NaviSong[];
  playlists: NaviPlaylist[];
  syncedAt: number;
}
