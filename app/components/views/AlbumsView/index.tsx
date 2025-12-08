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

import viewConfigMap, { AlbumView, NowPlayingView } from "..";
import { useFetchAlbums } from "hooks/utils/useDataFetcher";
import { getAlbum } from "utils/navidrome/client";
import { toMediaApiAlbum } from "utils/navidrome/types";

interface Props {
  albums?: MediaApi.Album[];
  inLibrary?: boolean;
}

const AlbumsView = ({ albums, inLibrary = true }: Props) => {
  const { isAuthorized } = useSettings();
  useMenuHideView(viewConfigMap.albums.id);
  const { play, playNext, addToQueue } = useAudioPlayer();
  const { showView } = useViewContext();

  const { data: fetchedAlbums, isLoading } = useFetchAlbums({
    lazy: !!albums,
  });

  const handleShuffle = useCallback(
    async (albumId: string) => {
      try {
        const naviAlbum = await getAlbum(albumId);
        const fullAlbum = toMediaApiAlbum(naviAlbum);

        if (!fullAlbum.songs || fullAlbum.songs.length === 0) {
          return;
        }

        const songs = [...fullAlbum.songs];
        for (let i = songs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [songs[i], songs[j]] = [songs[j], songs[i]];
        }

        await play({
          songs,
          startPosition: 0,
        });

        showView({
          id: viewConfigMap.nowPlaying.id,
          type: "screen",
          component: NowPlayingView,
        });
      } catch (error) {
        console.error("Failed to shuffle album:", error);
      }
    },
    [play, showView]
  );

  const handlePlayNext = useCallback(
    async (albumId: string) => {
      try {
        const naviAlbum = await getAlbum(albumId);
        const fullAlbum = toMediaApiAlbum(naviAlbum);

        if (!fullAlbum.songs || fullAlbum.songs.length === 0) {
          return;
        }

        await playNext({
          songs: fullAlbum.songs,
        });
      } catch (error) {
        console.error("Failed to play album next:", error);
      }
    },
    [playNext]
  );

  const handleAddToQueue = useCallback(
    async (albumId: string) => {
      try {
        const naviAlbum = await getAlbum(albumId);
        const fullAlbum = toMediaApiAlbum(naviAlbum);

        if (!fullAlbum.songs || fullAlbum.songs.length === 0) {
          return;
        }

        await addToQueue({
          songs: fullAlbum.songs,
        });
      } catch (error) {
        console.error("Failed to add album to queue:", error);
      }
    },
    [addToQueue]
  );

  const options: SelectableListOption[] = useMemo(() => {
    const data = albums ?? fetchedAlbums;

    return (
      data?.map((album) => ({
        type: "view" as const,
        headerTitle: album.name,
        label: album.name,
        sublabel: album.artistName,
        imageUrl: Utils.getArtwork(100, album.artwork?.url) ?? "",
        viewId: viewConfigMap.album.id,
        component: () => (
          <AlbumView id={album.id ?? ""} inLibrary={inLibrary} />
        ),
        longPressOptions: [
          {
            type: "action",
            label: "Play Next",
            onSelect: () => handlePlayNext(album.id),
          },
          {
            type: "action",
            label: "Add to Queue",
            onSelect: () => handleAddToQueue(album.id),
          },
          {
            type: "action",
            label: "Shuffle",
            onSelect: () => handleShuffle(album.id),
          },
          ...Utils.getMediaOptions("album", album.id),
        ],
      })) ?? []
    );
  }, [albums, fetchedAlbums, inLibrary, handleShuffle, handlePlayNext, handleAddToQueue]);

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.albums.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return isAuthorized ? (
    <SelectableList
      loading={isLoading}
      options={options}
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
      emptyMessage="No albums"
    />
  ) : (
    <AuthPrompt />
  );
};

export default AlbumsView;