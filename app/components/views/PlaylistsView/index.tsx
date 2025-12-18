import { useCallback, useMemo } from "react";

import { AuthPrompt, SelectableList, SelectableListOption } from "components";
import {
  useAudioPlayer,
  useMenuHideView,
  useMenuNavigation,
  useSettings,
  useViewContext,
} from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";

import viewConfigMap, { NowPlayingView, PlaylistView } from "..";
import { useFetchPlaylists } from "hooks/utils/useDataFetcher";
// Import Navidrome client and types for fetching/shuffling
import { getPlaylist } from "utils/navidrome/client";
import { toMediaApiPlaylist } from "utils/navidrome/types";

interface Props {
  playlists?: MediaApi.Playlist[];
  inLibrary?: boolean;
}

const PlaylistsView = ({ playlists, inLibrary = true }: Props) => {
  useMenuHideView(viewConfigMap.playlists.id);
  const { isAuthorized } = useSettings();
  const { play, playNext, addToQueue, togglePlaylistLoop } = useAudioPlayer();
  const { showView } = useViewContext();
  
  const {
    data: fetchedPlaylists,
    isLoading: isQueryLoading,
  } = useFetchPlaylists({
    lazy: !!playlists,
  });

  // Handle Shuffle: Fetches songs, shuffles them, and plays immediately
  const handleShuffle = useCallback(
    async (playlistId: string) => {
      try {
        // Fetch full playlist details to get the songs
        const naviPlaylist = await getPlaylist(playlistId);
        const fullPlaylist = toMediaApiPlaylist(naviPlaylist);

        if (!fullPlaylist.songs || fullPlaylist.songs.length === 0) {
          return;
        }

        // Shuffle logic (Fisher-Yates)
        const songs = [...fullPlaylist.songs];
        for (let i = songs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [songs[i], songs[j]] = [songs[j], songs[i]];
        }

        // Play: This replaces the queue and stops the current song immediately
        await play({
          songs,
          startPosition: 0,
        });

        // Open Now Playing view
        showView({
          id: viewConfigMap.nowPlaying.id,
          type: "screen",
          component: NowPlayingView,
        });
      } catch (error) {
        console.error("Failed to shuffle playlist:", error);
      }
    },
    [play, showView]
  );

  const handlePlayNext = useCallback(
    async (playlistId: string) => {
      try {
        const naviPlaylist = await getPlaylist(playlistId);
        const fullPlaylist = toMediaApiPlaylist(naviPlaylist);

        if (!fullPlaylist.songs || fullPlaylist.songs.length === 0) {
          return;
        }

        await playNext({
          songs: fullPlaylist.songs,
        });
      } catch (error) {
        console.error("Failed to play playlist next:", error);
      }
    },
    [playNext]
  );

  const handleAddToQueue = useCallback(
    async (playlistId: string) => {
      try {
        const naviPlaylist = await getPlaylist(playlistId);
        const fullPlaylist = toMediaApiPlaylist(naviPlaylist);

        if (!fullPlaylist.songs || fullPlaylist.songs.length === 0) {
          return;
        }

        await addToQueue({
          songs: fullPlaylist.songs,
        });
      } catch (error) {
        console.error("Failed to add playlist to queue:", error);
      }
    },
    [addToQueue]
  );

  const handleLoopPlaylist = useCallback(
    async (playlistId: string) => {
      try {
        const naviPlaylist = await getPlaylist(playlistId);
        const fullPlaylist = toMediaApiPlaylist(naviPlaylist);

        if (!fullPlaylist.songs || fullPlaylist.songs.length === 0) {
          return;
        }

        // Toggle playlist loop state
        togglePlaylistLoop();

        // Play the playlist from the beginning
        await play({
          songs: fullPlaylist.songs,
          startPosition: 0,
        });

        // Open Now Playing view
        showView({
          id: viewConfigMap.nowPlaying.id,
          type: "screen",
          component: NowPlayingView,
        });
      } catch (error) {
        console.error("Failed to play playlist with loop:", error);
      }
    },
    [play, showView, togglePlaylistLoop]
  );

  const options: SelectableListOption[] = useMemo(() => {
    const data = playlists ?? fetchedPlaylists;

    return (
      data?.map((playlist) => ({
        type: "view",
        label: playlist.name,
        sublabel: playlist.description || `By ${playlist.curatorName}`,
        imageUrl: Utils.getArtwork(100, playlist.artwork?.url),
        viewId: viewConfigMap.playlist.id,
        headerTitle: playlist.name,
        component: () => (
          <PlaylistView id={playlist.id} inLibrary={inLibrary} />
        ),
        // Add Shuffle to the Long Press menu options
        longPressOptions: [
          {
            type: "action",
            label: "Shuffle",
            onSelect: () => handleShuffle(playlist.id),
          },
          {
            type: "action",
            label: "Loop Playlist",
            onSelect: () => handleLoopPlaylist(playlist.id),
          },
          {
            type: "action",
            label: "Play Next",
            onSelect: () => handlePlayNext(playlist.id),
          },
          {
            type: "action",
            label: "Add to Queue",
            onSelect: () => handleAddToQueue(playlist.id),
          },
          ...Utils.getMediaOptions("playlist", playlist.id),
        ],
      })) ?? []
    );
  }, [fetchedPlaylists, inLibrary, playlists, handleShuffle, handleLoopPlaylist, handlePlayNext, handleAddToQueue]);

  const isLoading = !options.length && isQueryLoading;

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.playlists.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return isAuthorized ? (
    <SelectableList
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
      emptyMessage="No saved playlists"
      loading={isLoading}
      options={options}
    />
  ) : (
    <AuthPrompt message="Sign in to view your playlists" />
  );
};

export default PlaylistsView;