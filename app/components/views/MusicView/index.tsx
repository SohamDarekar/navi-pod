import React, { useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { SplitScreenPreview } from "components/previews";
import {
  AlbumsView,
  ArtistsView,
  CoverFlowView,
  NowPlayingView,
  PlaylistsView,
  QueueView,
  SearchView,
  viewConfigMap,
} from "components/views";
import {
  useAudioPlayer,
  useMenuHideView,
  useMenuNavigation,
  useSettings,
} from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";

const MusicView = () => {
  const { isAuthorized } = useSettings();
  const { nowPlayingItem } = useAudioPlayer();
  useMenuHideView(viewConfigMap.music.id);

  const options: SelectableListOption[] = useMemo(() => {
    const arr: SelectableListOption[] = [
      {
        type: "view",
        label: "Cover Flow",
        viewId: viewConfigMap.coverFlow.id,
        component: () => <CoverFlowView />,
        preview: SplitScreenPreview.Music,
      },
      {
        type: "view",
        label: "Playlists",
        viewId: viewConfigMap.playlists.id,
        component: () => <PlaylistsView />,
        preview: SplitScreenPreview.Music,
      },
      {
        type: "view",
        label: "Artists",
        viewId: viewConfigMap.artists.id,
        component: () => <ArtistsView />,
        preview: SplitScreenPreview.Music,
      },
      {
        type: "view",
        label: "Albums",
        viewId: viewConfigMap.albums.id,
        component: () => <AlbumsView />,
        preview: SplitScreenPreview.Music,
      },
      {
        type: "view",
        label: "Search",
        viewId: viewConfigMap.search.id,
        component: () => <SearchView />,
        preview: SplitScreenPreview.Music,
      },
    ];

    if (isAuthorized && !!nowPlayingItem) {
      arr.push({
        type: "view",
        label: "Now playing",
        viewId: viewConfigMap.nowPlaying.id,
        component: () => <NowPlayingView />,
        preview: SplitScreenPreview.NowPlaying,
      });
      arr.push({
        type: "view",
        label: "Queue",
        viewId: viewConfigMap.queue.id,
        component: () => <QueueView />,
        preview: SplitScreenPreview.Music,
      });
    }

    return arr;
  }, [isAuthorized, nowPlayingItem]);

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.music.id,
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

export default MusicView;
