import { useCallback, useMemo } from "react";

import { SelectableList, SelectableListOption } from "components";
import { AlbumView, viewConfigMap, NowPlayingView } from "components/views";
import { useMenuHideView, useMenuNavigation, useAudioPlayer, useViewContext } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";
import { useFetchArtistAlbums } from "hooks/utils/useDataFetcher";
// Imports for shuffling
import { getAlbum } from "utils/navidrome/client";
import { toMediaApiAlbum } from "utils/navidrome/types";

interface Props {
  id: string;
  inLibrary?: boolean;
}

const ArtistView = ({ id }: Props) => {
  useMenuHideView(viewConfigMap.artist.id);
  const { play } = useAudioPlayer();
  const { showView } = useViewContext();

  const { data: albums, isLoading } = useFetchArtistAlbums({
    id,
  });

  const handleShuffleAlbum = useCallback(
    async (albumId: string) => {
      try {
        const naviAlbum = await getAlbum(albumId);
        const fullAlbum = toMediaApiAlbum(naviAlbum);

        if (!fullAlbum.songs || fullAlbum.songs.length === 0) {
          return;
        }

        // Shuffle logic
        const songs = [...fullAlbum.songs];
        for (let i = songs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [songs[i], songs[j]] = [songs[j], songs[i]];
        }

        // Play (Stops current music and replaces queue)
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

  const options: SelectableListOption[] = useMemo(
    () =>
      albums?.map(
        (album): SelectableListOption => ({
          type: "view",
          headerTitle: album.name,
          label: album.name,
          sublabel: album.artistName,
          imageUrl: Utils.getArtwork(100, album.artwork?.url),
          viewId: viewConfigMap.album.id,
          component: () => (
            <AlbumView id={album.id ?? ""} />
          ),
          longPressOptions: [
            {
              type: "action",
              label: "Shuffle",
              onSelect: () => handleShuffleAlbum(album.id),
            },
            ...Utils.getMediaOptions("album", album.id),
          ],
        })
      ) ?? [],
    [albums, handleShuffleAlbum]
  );

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.artist.id,
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
      emptyMessage="No albums by this artist"
    />
  );
};

export default ArtistView;