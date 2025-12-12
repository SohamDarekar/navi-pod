/**
 * NaviPod - Navidrome Client
 * Subsonic API client with MD5 legacy authentication
 */

import md5 from "md5";
import type {
  NavidromeCredentials,
  SubsonicResponse,
  NaviSong,
  NaviAlbum,
  NaviArtist,
  NaviPlaylist,
  ArtistsResponse,
  ArtistResponse,
  AlbumListResponse,
  AlbumResponse,
  PlaylistsResponse,
  PlaylistResponse,
  SearchResult3Response,
  RandomSongsResponse,
  SubsonicSong,
  SubsonicAlbum,
  SubsonicArtist,
  SubsonicPlaylist,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
  SERVER_URL: "navidrome_url",
  USERNAME: "navidrome_user",
  PASSWORD: "navidrome_pass",
  AUTO_SYNC: "navidrome_auto_sync",
} as const;

const API_VERSION = "1.16.1";
const CLIENT_NAME = "NaviPod";

// ============================================================================
// Credential Management
// ============================================================================

export function getCredentials(): NavidromeCredentials | null {
  if (typeof window === "undefined") return null;

  const serverUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
  const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
  const password = localStorage.getItem(STORAGE_KEYS.PASSWORD);

  if (!serverUrl || !username || !password) {
    return null;
  }

  return { serverUrl, username, password };
}

export function saveCredentials(credentials: NavidromeCredentials): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.SERVER_URL, credentials.serverUrl);
  localStorage.setItem(STORAGE_KEYS.USERNAME, credentials.username);
  localStorage.setItem(STORAGE_KEYS.PASSWORD, credentials.password);
}

export function clearCredentials(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.SERVER_URL);
  localStorage.removeItem(STORAGE_KEYS.USERNAME);
  localStorage.removeItem(STORAGE_KEYS.PASSWORD);
}

export function isAuthenticated(): boolean {
  return getCredentials() !== null;
}

export function getAutoSyncEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === "true";
}

export function setAutoSyncEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(enabled));
}

// ============================================================================
// Authentication Helpers
// ============================================================================

function generateSalt(length: number = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

function getAuthParams(credentials: NavidromeCredentials): Record<string, string> {
  const salt = generateSalt();
  const token = md5(credentials.password + salt);

  return {
    u: credentials.username,
    t: token,
    s: salt,
    v: API_VERSION,
    c: CLIENT_NAME,
    f: "json",
  };
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

// ============================================================================
// Core API Functions
// ============================================================================

export async function fetchNavidrome<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error("Not authenticated with Navidrome");
  }

  const authParams = getAuthParams(credentials);
  const allParams = { ...authParams, ...params };
  const queryString = buildQueryString(allParams);

  // Normalize server URL (remove trailing slash)
  const baseUrl = credentials.serverUrl.replace(/\/$/, "");
  const url = `${baseUrl}/rest/${endpoint}?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Navidrome API error: ${response.status} ${response.statusText}`);
  }

  const data: SubsonicResponse<T> = await response.json();

  if (data["subsonic-response"].status === "failed") {
    const error = data["subsonic-response"].error;
    throw new Error(error?.message || "Unknown Navidrome error");
  }

  return data["subsonic-response"] as T;
}

export async function testConnection(credentials: NavidromeCredentials): Promise<boolean> {
  const authParams = getAuthParams(credentials);
  const queryString = buildQueryString(authParams);
  const baseUrl = credentials.serverUrl.replace(/\/$/, "");
  const url = `${baseUrl}/rest/ping?${queryString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const data: SubsonicResponse = await response.json();
    return data["subsonic-response"].status === "ok";
  } catch {
    return false;
  }
}

// ============================================================================
// URL Generators
// ============================================================================

/**
 * Generate a streaming URL for a song
 * Supports multiple quality formats: raw (FLAC), mp3, opus, aac
 */
export function getStreamUrl(songId: string, format: "raw" | "mp3" | "opus" | "aac" = "raw"): string {
  const credentials = getCredentials();
  if (!credentials) return "";

  const authParams = getAuthParams(credentials);
  const params = {
    ...authParams,
    id: songId,
    format: format,
    estimateContentLength: "true",
  };

  const queryString = buildQueryString(params);
  const baseUrl = credentials.serverUrl.replace(/\/$/, "");

  return `${baseUrl}/rest/stream?${queryString}`;
}

/**
 * Generate a cover art URL
 */
export function getCoverArtUrl(coverArtId: string | undefined, size: number = 300): string {
  if (!coverArtId) return "/default_album_artwork.png";

  const credentials = getCredentials();
  if (!credentials) return "/default_album_artwork.png";

  const authParams = getAuthParams(credentials);
  const params = {
    ...authParams,
    id: coverArtId,
    size: size,
  };

  const queryString = buildQueryString(params);
  const baseUrl = credentials.serverUrl.replace(/\/$/, "");

  return `${baseUrl}/rest/getCoverArt?${queryString}`;
}

// ============================================================================
// Data Transformers
// ============================================================================

function transformSong(song: SubsonicSong): NaviSong {
  return {
    id: song.id,
    title: song.title,
    album: song.album,
    albumId: song.albumId,
    artist: song.artist,
    artistId: song.artistId,
    track: song.track,
    year: song.year,
    genre: song.genre,
    duration: song.duration,
    bitRate: song.bitRate,
    size: song.size,
    suffix: song.suffix,
    contentType: song.contentType,
    path: song.path,
    coverArt: song.coverArt,
    created: song.created,
    starred: song.starred,
    playCount: song.playCount,
    discNumber: song.discNumber,
    streamUrl: getStreamUrl(song.id),
    artworkUrl: getCoverArtUrl(song.coverArt),
  };
}

function transformAlbum(album: SubsonicAlbum, songs?: SubsonicSong[]): NaviAlbum {
  return {
    id: album.id,
    name: album.name,
    artist: album.artist,
    artistId: album.artistId,
    coverArt: album.coverArt,
    songCount: album.songCount,
    duration: album.duration,
    year: album.year,
    genre: album.genre,
    created: album.created,
    starred: album.starred,
    playCount: album.playCount,
    songs: songs?.map(transformSong),
    artworkUrl: getCoverArtUrl(album.coverArt),
  };
}

function transformArtist(artist: SubsonicArtist, albums?: SubsonicAlbum[]): NaviArtist {
  return {
    id: artist.id,
    name: artist.name,
    coverArt: artist.coverArt,
    albumCount: artist.albumCount,
    starred: artist.starred,
    albums: albums?.map((a) => transformAlbum(a)),
    artworkUrl: getCoverArtUrl(artist.coverArt),
  };
}

function transformPlaylist(playlist: SubsonicPlaylist, songs?: SubsonicSong[]): NaviPlaylist {
  return {
    id: playlist.id,
    name: playlist.name,
    comment: playlist.comment,
    owner: playlist.owner,
    public: playlist.public,
    songCount: playlist.songCount,
    duration: playlist.duration,
    created: playlist.created,
    changed: playlist.changed,
    coverArt: playlist.coverArt,
    songs: songs?.map(transformSong),
    artworkUrl: getCoverArtUrl(playlist.coverArt),
  };
}

// ============================================================================
// API Methods
// ============================================================================

export async function getArtists(): Promise<NaviArtist[]> {
  const response = await fetchNavidrome<ArtistsResponse>("getArtists");
  const artists: NaviArtist[] = [];

  for (const index of response.artists.index) {
    for (const artist of index.artist) {
      artists.push(transformArtist(artist));
    }
  }

  return artists;
}

export async function getArtist(id: string): Promise<NaviArtist> {
  const response = await fetchNavidrome<ArtistResponse>("getArtist", { id });
  return transformArtist(response.artist, response.artist.album);
}

export async function getAlbums(
  type: "newest" | "recent" | "frequent" | "random" | "alphabeticalByName" | "alphabeticalByArtist" = "alphabeticalByName",
  size: number = 500,
  offset: number = 0
): Promise<NaviAlbum[]> {
  const response = await fetchNavidrome<AlbumListResponse>("getAlbumList2", {
    type,
    size,
    offset,
  });

  return response.albumList2.album.map((a) => transformAlbum(a));
}

export async function getAlbum(id: string): Promise<NaviAlbum> {
  const response = await fetchNavidrome<AlbumResponse>("getAlbum", { id });
  return transformAlbum(response.album, response.album.song);
}

export async function getPlaylists(): Promise<NaviPlaylist[]> {
  const response = await fetchNavidrome<PlaylistsResponse>("getPlaylists");
  return response.playlists.playlist.map((p) => transformPlaylist(p));
}

export async function getPlaylist(id: string): Promise<NaviPlaylist> {
  const response = await fetchNavidrome<PlaylistResponse>("getPlaylist", { id });
  return transformPlaylist(response.playlist, response.playlist.entry);
}

export async function search(
  query: string,
  artistCount: number = 20,
  albumCount: number = 20,
  songCount: number = 20
): Promise<{
  artists: NaviArtist[];
  albums: NaviAlbum[];
  songs: NaviSong[];
}> {
  const response = await fetchNavidrome<SearchResult3Response>("search3", {
    query,
    artistCount,
    albumCount,
    songCount,
  });

  return {
    artists: response.searchResult3.artist?.map((a) => transformArtist(a)) || [],
    albums: response.searchResult3.album?.map((a) => transformAlbum(a)) || [],
    songs: response.searchResult3.song?.map((s) => transformSong(s)) || [],
  };
}

export async function getRandomSongs(size: number = 50): Promise<NaviSong[]> {
  const response = await fetchNavidrome<RandomSongsResponse>("getRandomSongs", { size });
  return response.randomSongs.song.map(transformSong);
}

export async function getAllSongs(size: number = 500, offset: number = 0): Promise<NaviSong[]> {
  // Get songs via search with empty query - returns all songs
  const response = await fetchNavidrome<SearchResult3Response>("search3", {
    query: "",
    songCount: size,
    songOffset: offset,
    artistCount: 0,
    albumCount: 0,
  });

  return response.searchResult3.song?.map(transformSong) || [];
}

// ============================================================================
// Playback Reporting (Scrobbling)
// ============================================================================

export async function scrobble(songId: string, submission: boolean = true): Promise<void> {
  await fetchNavidrome("scrobble", {
    id: songId,
    submission: submission,
  });
}

export async function nowPlaying(songId: string): Promise<void> {
  await scrobble(songId, false);
}

// ============================================================================
// Library Sync Helpers
// ============================================================================

export interface FullLibrary {
  artists: NaviArtist[];
  albums: NaviAlbum[];
  songs: NaviSong[];
  playlists: NaviPlaylist[];
}

export async function fetchFullLibrary(): Promise<FullLibrary> {
  const [artists, albums, playlists] = await Promise.all([
    getArtists(),
    getAlbums("alphabeticalByName", 10000),
    getPlaylists(),
  ]);

  // Get all songs through albums to ensure complete library
  const allSongs: NaviSong[] = [];
  const albumsWithSongs: NaviAlbum[] = [];

  // Fetch songs for each album in batches
  const batchSize = 10;
  for (let i = 0; i < albums.length; i += batchSize) {
    const batch = albums.slice(i, i + batchSize);
    const albumDetails = await Promise.all(batch.map((a) => getAlbum(a.id)));
    
    for (const album of albumDetails) {
      albumsWithSongs.push(album);
      if (album.songs) {
        allSongs.push(...album.songs);
      }
    }
  }

  return {
    artists,
    albums: albumsWithSongs,
    songs: allSongs,
    playlists,
  };
}

// ============================================================================
// Export Storage Keys for External Use
// ============================================================================

export { STORAGE_KEYS };
