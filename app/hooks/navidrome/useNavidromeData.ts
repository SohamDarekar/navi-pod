/**
 * NaviPod - Navidrome Data Fetcher Hook
 * TanStack Query powered data layer for Navidrome
 */

import { useQuery } from "@tanstack/react-query";
import {
  getArtists,
  getArtist,
  getAlbums,
  getAlbum,
  getPlaylists,
  getPlaylist,
  search,
  isAuthenticated,
} from "utils/navidrome/client";
import {
  toMediaApiSong,
  toMediaApiAlbum,
  toMediaApiArtist,
  toMediaApiPlaylist,
} from "utils/navidrome/types";

// ============================================================================
// Hook: Fetch Albums
// ============================================================================

interface AlbumsFetcherProps {
  lazy?: boolean;
}

export const useFetchAlbums = (options: AlbumsFetcherProps = {}) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const albums = await getAlbums("alphabeticalByName", 500, 0);
      return albums.map(toMediaApiAlbum);
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Single Album
// ============================================================================

interface AlbumFetcherProps {
  id: string;
  lazy?: boolean;
}

export const useFetchAlbum = (options: AlbumFetcherProps) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["album", { id: options.id }],
    queryFn: async () => {
      const album = await getAlbum(options.id);
      return toMediaApiAlbum(album);
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Artists
// ============================================================================

interface ArtistsFetcherProps {
  lazy?: boolean;
}

export const useFetchArtists = (options: ArtistsFetcherProps = {}) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const artists = await getArtists();
      return artists.map(toMediaApiArtist);
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Artist Albums
// ============================================================================

interface ArtistAlbumsFetcherProps {
  id: string;
  lazy?: boolean;
}

export const useFetchArtistAlbums = (options: ArtistAlbumsFetcherProps) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["artistAlbums", { id: options.id }],
    queryFn: async () => {
      const artist = await getArtist(options.id);
      return artist.albums?.map(toMediaApiAlbum) || [];
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Playlists
// ============================================================================

interface PlaylistsFetcherProps {
  lazy?: boolean;
}

export const useFetchPlaylists = (options: PlaylistsFetcherProps = {}) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const playlists = await getPlaylists();
      return playlists.map(toMediaApiPlaylist);
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Single Playlist
// ============================================================================

interface PlaylistFetcherProps {
  id: string;
  lazy?: boolean;
}

export const useFetchPlaylist = (options: PlaylistFetcherProps) => {
  const enabled = isAuthenticated() && !options.lazy;

  return useQuery({
    queryKey: ["playlist", { id: options.id }],
    queryFn: async () => {
      const playlist = await getPlaylist(options.id);
      return toMediaApiPlaylist(playlist);
    },
    enabled,
  });
};

// ============================================================================
// Hook: Fetch Search Results
// ============================================================================

interface SearchFetcherProps {
  query: string;
  lazy?: boolean;
}

export const useFetchSearchResults = (options: SearchFetcherProps) => {
  const enabled = isAuthenticated() && !options.lazy && options.query.length > 0;

  return useQuery({
    queryKey: ["search", { query: options.query }],
    queryFn: async (): Promise<MediaApi.SearchResults> => {
      const results = await search(options.query);
      return {
        artists: results.artists.map(toMediaApiArtist),
        albums: results.albums.map(toMediaApiAlbum),
        songs: results.songs.map(toMediaApiSong),
        playlists: [],
      };
    },
    enabled,
  });
};
