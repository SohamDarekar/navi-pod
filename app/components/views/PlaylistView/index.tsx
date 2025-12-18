import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useAudioPlayer, useEventListener, useMenuHideView, useMenuNavigation, useViewContext } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";
import { useFetchPlaylist } from "hooks/utils/useDataFetcher";
import { IpodEvent } from "utils/events";

interface Props {
  id: string;
  inLibrary?: boolean;
}

const PlaylistView = ({ id }: Props) => {
  useMenuHideView(viewConfigMap.playlist.id);
  const { play, playNext, addToQueue, isPlaylistLooping, togglePlaylistLoop } = useAudioPlayer();
  const { showView } = useViewContext();
  
  const { data: playlist, isLoading } = useFetchPlaylist({
    id,
  });

  const handlePlayNext = useCallback(
    (song: MediaApi.Song) => {
      playNext({
        song,
      });
    },
    [playNext]
  );

  const handleAddToQueue = useCallback(
    (song: MediaApi.Song) => {
      addToQueue({
        song,
      });
    },
    [addToQueue]
  );

  const handleShuffle = useCallback(async () => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      return;
    }

    // Shuffle logic (Fisher-Yates)
    const songs = [...playlist.songs];
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }

    // Play the shuffled playlist
    await play({
      songs,
      startPosition: 0,
    });
  }, [playlist, play]);

  const handleLoopPlaylist = useCallback(async () => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      return;
    }

    // Toggle playlist loop state
    togglePlaylistLoop();

    // Play the playlist from the beginning
    await play({
      songs: playlist.songs,
      startPosition: 0,
    });
  }, [playlist, play, togglePlaylistLoop]);

  // Handle center button long press to show action sheet
  const handleCenterLongClick = useCallback(() => {
    if (!playlist) return;

    showView({
      type: "actionSheet",
      id: viewConfigMap.mediaActionSheet.id,
      listOptions: [
        {
          type: "action",
          label: "Shuffle",
          onSelect: handleShuffle,
        },
        {
          type: "action",
          label: isPlaylistLooping ? "Loop Playlist: On" : "Loop Playlist: Off",
          isSelected: isPlaylistLooping,
          onSelect: handleLoopPlaylist,
        },
      ],
    });
  }, [playlist, isPlaylistLooping, handleShuffle, handleLoopPlaylist, showView]);

  useEventListener<IpodEvent>("centerlongclick", handleCenterLongClick);

  const options: SelectableListOption[] = useMemo(
    () =>
      playlist?.songs.map((song, index) => ({
        type: "song",
        label: song.name,
        sublabel: song.artistName ?? "Unknown artist",
        imageUrl: Utils.getArtwork(100, song.artwork?.url),
        queueOptions: {
          playlist,
          startPosition: index,
        },
        showNowPlayingView: true,
        longPressOptions: [
          {
            type: "action",
            label: "Play Next",
            onSelect: () => handlePlayNext(song),
          },
          {
            type: "action",
            label: "Add to Queue",
            onSelect: () => handleAddToQueue(song),
          },
          ...Utils.getMediaOptions("song", song.id),
        ],
      })) ?? [],
    [playlist, handlePlayNext, handleAddToQueue]
  );

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.playlist.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return (
    <SelectableList
      loading={isLoading}
      options={options}
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
      emptyMessage="No songs in this playlist"
    />
  );
};

export default PlaylistView;