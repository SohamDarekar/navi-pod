import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useAudioPlayer, useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";
import { useFetchPlaylist } from "hooks/utils/useDataFetcher";

interface Props {
  id: string;
  inLibrary?: boolean;
}

const PlaylistView = ({ id }: Props) => {
  useMenuHideView(viewConfigMap.playlist.id);
  const { playNext, addToQueue } = useAudioPlayer();
  
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