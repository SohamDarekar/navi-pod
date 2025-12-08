import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useAudioPlayer, useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";

const QueueView = () => {
  useMenuHideView(viewConfigMap.queue.id);
  const { queue, play, removeFromQueue } = useAudioPlayer();

  const handlePlaySong = useCallback(
    (index: number) => {
      play({
        songs: queue,
        startPosition: index,
      });
    },
    [play, queue]
  );

  const handleRemoveFromQueue = useCallback(
    (index: number) => {
      removeFromQueue(index);
    },
    [removeFromQueue]
  );

  const options: SelectableListOption[] = useMemo(
    () =>
      queue.map((song, index) => ({
        type: "action",
        label: song.name,
        sublabel: `${song.artistName} • ${song.albumName}`,
        onSelect: () => handlePlaySong(index),
        imageUrl: Utils.getArtwork(50, song.artwork?.url),
        longPressOptions: [
          {
            type: "action",
            label: "Remove from Queue",
            onSelect: () => handleRemoveFromQueue(index),
          },
          ...Utils.getMediaOptions("song", song.id),
        ],
      })) ?? [],
    [queue, handlePlaySong, handleRemoveFromQueue]
  );

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.queue.id,
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
      emptyMessage="Queue is empty"
    />
  );
};

export default QueueView;
