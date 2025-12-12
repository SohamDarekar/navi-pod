import { useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { useMenuHideView, useMenuNavigation, usePlaybackQuality, useFadeSettings } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import viewConfigMap from "components/views";
import type { PlaybackQuality } from "hooks/utils/usePlaybackQuality";
import type { FadeDuration } from "hooks/utils/useFadeSettings";

const PlaybackSettingsView = () => {
  useMenuHideView(viewConfigMap.playbackSettings.id);
  const { quality, setQuality } = usePlaybackQuality();
  const { fadeIn, fadeOut, setFadeIn, setFadeOut } = useFadeSettings();

  const getQualityLabel = (q: PlaybackQuality): string => {
    switch (q) {
      case "raw":
        return "Raw (FLAC)";
      case "mp3":
        return "MP3";
      case "opus":
        return "Opus";
      case "aac":
        return "AAC";
      default:
        return q;
    }
  };

  const getFadeDurationLabel = (duration: FadeDuration): string => {
    return duration === 0 ? "Off" : `${duration} secs`;
  };

  const options: SelectableListOption[] = useMemo(() => {
    const qualities: PlaybackQuality[] = ["raw", "mp3", "opus", "aac"];
    const fadeDurations: FadeDuration[] = [0, 3, 5, 7, 10];

    return [
      {
        type: "action",
        label: "Quality",
        onSelect: () => {},
        longPressOptions: qualities.map((q): SelectableListOption => ({
          type: "action",
          label: `${getQualityLabel(q)}${quality === q ? " ✓" : ""}`,
          isSelected: quality === q,
          onSelect: () => setQuality(q),
        })),
      },
      {
        type: "action",
        label: "Fade In",
        onSelect: () => {},
        longPressOptions: fadeDurations.map((duration): SelectableListOption => ({
          type: "action",
          label: `${getFadeDurationLabel(duration)}${fadeIn === duration ? " ✓" : ""}`,
          isSelected: fadeIn === duration,
          onSelect: () => setFadeIn(duration),
        })),
      },
      {
        type: "action",
        label: "Fade Out",
        onSelect: () => {},
        longPressOptions: fadeDurations.map((duration): SelectableListOption => ({
          type: "action",
          label: `${getFadeDurationLabel(duration)}${fadeOut === duration ? " ✓" : ""}`,
          isSelected: fadeOut === duration,
          onSelect: () => setFadeOut(duration),
        })),
      },
    ];
  }, [quality, setQuality, fadeIn, fadeOut, setFadeIn, setFadeOut]);

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.playbackSettings.id,
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
    />
  );
};

export default PlaybackSettingsView;
