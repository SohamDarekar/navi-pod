import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useAudioPlayer, useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";

const QueueView = () => {
  useMenuHideView(viewConfigMap.queue.id);
  // 1. Destructure currentIndex safely with default value
  const { queue, currentIndex = 0, play } = useAudioPlayer();

  const visibleQueue = useMemo(() => {
    // 2. SAFETY CHECK: Ensure queue exists before slicing
    // If queue is undefined, default to empty array []
    const safeQueue = queue || [];
    
    if (safeQueue.length === 0) return [];
    
    // Ensure currentIndex is a valid number
    const safeIndex = typeof currentIndex === 'number' ? currentIndex : 0;
    
    return safeQueue.slice(safeIndex);
  }, [queue, currentIndex]);

  const options: SelectableListOption[] = useMemo(
    () =>
      visibleQueue.map((song, idx) => ({
        type: "action" as const,
        label: song.name,
        sublabel: song.artistName,
        imageUrl: Utils.getArtwork(50, song.artwork?.url),
        onSelect: async () => {
          // Calculate real index (relative to full queue)
          const safeCurrentIndex = typeof currentIndex === 'number' ? currentIndex : 0;
          const realIndex = safeCurrentIndex + idx;
          
          const safeQueue = queue || [];
          if (realIndex < safeQueue.length) {
            await play({ songs: safeQueue, startPosition: realIndex });
          }
        },
      })),
    [visibleQueue, queue, currentIndex, play]
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
      emptyMessage="Your queue is empty"
    />
  );
};

export default QueueView;