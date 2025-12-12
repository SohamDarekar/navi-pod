declare namespace MediaApi {
  export interface Song {
    id: string;
    title?: string;
    name: string;
    artist?: string;
    artistName: string;
    artistId?: string;
    album?: string;
    albumName: string;
    albumId?: string;
    duration: number;
    path?: string;
    url?: string;
    trackNumber?: number;
    discNumber?: number;
    year?: number;
    genre?: string;
    coverArt?: string;
    artwork?: {
      url: string;
    };
  }

  export interface Album {
    id: string;
    name: string;
    artist?: string;
    artistName?: string;
    artistId?: string;
    coverArt?: string;
    year?: number;
    url?: string;
    songs: Song[];
    artwork?: {
      url: string;
    };
  }

  export interface Artist {
    id: string;
    name: string;
    url: string;
    artwork?: {
      url: string;
    };
    albums?: Album[];
  }

  export interface Playlist {
    id: string;
    name: string;
    comment?: string;
    description?: string;
    curatorName?: string;
    url?: string;
    artwork?: {
      url: string;
    };
    songs: Song[];
  }

  export interface QueueOptions {
    songs?: Song[];
    album?: Album;
    playlist?: Playlist;
    song?: Song;
    // ADD THIS LINE BELOW:
    startPosition?: number; 
  }

  export interface MediaItem extends Song {
    artwork?: {
      url: string;
    };
    artistName?: string;
    albumName?: string;
    name?: string;
  }

  export interface SearchResults {
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    playlists: Playlist[];
  }
}