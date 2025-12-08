import { useCallback, useMemo } from "react";

import { AuthPrompt, SelectableList, SelectableListOption } from "components";
import { useMenuHideView, useMenuNavigation, useSettings, useAudioPlayer, useViewContext } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import * as Utils from "utils";
// Added getAlbum and toMediaApiSong imports
import { getArtist, getAlbum } from "utils/navidrome/client";
import { toMediaApiSong } from "utils/navidrome/types";

import viewConfigMap, { ArtistView, NowPlayingView } from "..";
import { useFetchArtists } from "hooks/utils/useDataFetcher";

interface Props {
  artists?: MediaApi.Artist[];
  inLibrary?: boolean;
  showImages?: boolean;
}

const ArtistsView = ({
  artists,
  inLibrary = true,
  showImages = false,
}: Props) => {
  useMenuHideView(viewConfigMap.artists.id);
  const { isAuthorized } = useSettings();
  const { play } = useAudioPlayer();
  const { showView } = useViewContext();

  const { data: fetchedArtists, isLoading: isQueryLoading } = useFetchArtists({
    lazy: !!artists,
  });

  const handleShuffleArtist = useCallback(
    async (artistId: string) => {
      try {
        // 1. Fetch artist to get the list of albums
        const naviArtist = await getArtist(artistId);

        if (!naviArtist.albums || naviArtist.albums.length === 0) {
          return;
        }

        // 2. Fetch full details (songs) for ALL albums in parallel
        const albumPromises = naviArtist.albums.map((album) => getAlbum(album.id));
        const fullAlbums = await Promise.all(albumPromises);

        // 3. Aggregate all songs
        const allSongs = fullAlbums.flatMap((album) => 
          (album.songs || []).map(toMediaApiSong)
        );

        if (allSongs.length === 0) return;

        // 4. Fisher-Yates shuffle
        const shuffledSongs = [...allSongs];
        for (let i = shuffledSongs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
        }

        // 5. Play (This stops current music and replaces the queue)
        await play({
          songs: shuffledSongs,
          startPosition: 0,
        });

        showView({
          id: viewConfigMap.nowPlaying.id,
          type: "screen",
          component: NowPlayingView,
        });
      } catch (error) {
        console.error("Failed to shuffle artist:", error);
      }
    },
    [play, showView]
  );

  const options: SelectableListOption[] = useMemo(() => {
    const data = artists ?? fetchedArtists;

    return (
      data?.map(
        (artist): SelectableListOption => ({
          type: "view",
          headerTitle: artist.name,
          label: artist.name,
          viewId: viewConfigMap.artist.id,
          imageUrl: showImages
            ? Utils.getArtwork(50, artist.artwork?.url) ?? "artists_icon.svg"
            : "",
          component: () => <ArtistView id={artist.id} inLibrary={inLibrary} />,
          longPressOptions: [
            {
              type: "action",
              label: "Shuffle",
              onSelect: () => handleShuffleArtist(artist.id),
            },
          ],
        })
      ) ?? []
    );
  }, [artists, fetchedArtists, inLibrary, showImages, handleShuffleArtist]);

  const isLoading = !options.length && isQueryLoading;

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.artists.id,
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
      emptyMessage="No saved artists"
    />
  ) : (
    <AuthPrompt message="Sign in to view your artists" />
  );
};

export default ArtistsView;