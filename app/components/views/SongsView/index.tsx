import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useAudioPlayer, useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";

interface Props {
  songs: MediaApi.Song[];
}

const SongsView = ({ songs }: Props) => {
  useMenuHideView(viewConfigMap.songs.id);
  const { playNext, addToQueue } = useAudioPlayer();

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
      songs.map((song) => ({
        type: "song",
        label: song.name,
        sublabel: `${song.artistName} • ${song.albumName}`,
        queueOptions: {
          song,
          startPosition: 0,
        },
        imageUrl: Utils.getArtwork(50, song.artwork?.url),
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
    [songs, handlePlayNext, handleAddToQueue]
  );

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.songs.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return (
    <SelectableList
      options={options}
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
      emptyMessage="No songs"
    />
  );
};

export default SongsView;