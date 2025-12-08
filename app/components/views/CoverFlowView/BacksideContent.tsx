import { useCallback, useMemo } from "react";

import {
  LoadingScreen,
  SelectableList,
  SelectableListOption,
} from "components";
import { useEventListener, useMenuNavigation, useViewContext } from "hooks";
import styled from "styled-components";
import { MENU_CONFIG_STANDARD } from "utils/constants";

import viewConfigMap from "..";
import { IpodEvent } from "utils/events";
import { useFetchAlbum } from "hooks/utils/useDataFetcher";

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: -28%;
  bottom: -65%; /* Increased height to fit 4 items and prevent cutoff */
  left: -50%;
  right: -50%;
  border: 1px solid lightgray;
  background: white;
  transform: rotateY(180deg);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
`;

const InfoContainer = styled.div`
  padding: 4px 8px;
  background: linear-gradient(180deg, #6585ad 0%, #789ab3 100%);
  border-bottom: 1px solid #6d87a3;
  flex-shrink: 0; /* Prevent header from shrinking */
`;

const Text = styled.h3`
  font-size: 16px;
  margin: 0;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtext = styled(Text)`
  font-size: 14px;
  font-weight: normal;
`;

const ListContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden; /* Hide overflow to align highlighter correctly */
`;

interface Props {
  albumId: MediaApi.Album["id"];
  setPlayingAlbum: (val: boolean) => void;
}

const BacksideContent = ({ albumId, setPlayingAlbum }: Props) => {
  const { setHeaderTitle } = useViewContext();

  const { data: album, isLoading } = useFetchAlbum({
    id: albumId,
  });

  const options: SelectableListOption[] = useMemo(
    () =>
      album?.songs.map((song, index) => ({
        type: "song",
        label: song.name,
        sublabel: song.artistName, // Added artist name here
        queueOptions: {
          album,
          startPosition: index,
        },
      })) ?? [],
    [album]
  );

  // Set visible count to 4 to match the container space
  const visibleCount = 4;

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.coverFlow.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
    visibleCount,
  });

  const handleSelect = useCallback(() => {
    setPlayingAlbum(true);
    setHeaderTitle("Now Playing");
  }, [setHeaderTitle, setPlayingAlbum]);

  useEventListener<IpodEvent>("centerclick", handleSelect);

  return (
    <Container>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <InfoContainer>
            <Text>{album?.name}</Text>
            <Subtext>{album?.artistName}</Subtext>
          </InfoContainer>
          <ListContainer>
            <SelectableList
              activeIndex={selectedIndex}
              scrollOffset={scrollOffset}
              itemHeight={MENU_CONFIG_STANDARD.itemHeight}
              visibleCount={visibleCount}
              options={options}
            />
          </ListContainer>
        </>
      )}
    </Container>
  );
};

export default BacksideContent;