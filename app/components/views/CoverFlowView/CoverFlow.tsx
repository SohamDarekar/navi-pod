import { useCallback, useEffect, useRef, useState } from "react";

import { fade } from "animation";
import { NowPlaying } from "components";
import viewConfigMap from "components/views";
import { AnimatePresence, motion } from "framer-motion";
import { useEventListener, useViewContext } from "hooks";
import styled from "styled-components";

import AlbumCover from "./AlbumCover";
import { IpodEvent } from "utils/events";

export type Point = {
  x: number;
  y: number;
};

const Container = styled.div`
  height: 100%;
`;

const AlbumsContainer = styled.div`
  height: 100%;
  z-index: 2;
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  flex: 1;
  padding-top: 20px;
  -webkit-overflow-scrolling: touch; /* [3] */
  -ms-overflow-style: -ms-autohiding-scrollbar;
  perspective: 500px;
`;

const InfoContainer = styled(motion.div)`
  z-index: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24%;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
`;

const NowPlayingContainer = styled(motion.div)`
  z-index: 1;
  position: absolute;
  top: 20px;
  bottom: 0;
  left: 0;
  right: 0;
`;

const Text = styled.h3`
  margin: 0;
  font-size: 16px;
  text-align: center;
  padding: 0 16px;

  :first-of-type {
    margin-top: 24px;
  }
`;

interface Props {
  albums: MediaApi.Album[];
}

const CoverFlow = ({ albums }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [midpoint, setMidpoint] = useState<Point>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaApi.Album>();
  const [playingAlbum, setPlayingAlbum] = useState(false);
  const { hideView, setHeaderTitle, viewStack } = useViewContext();
  
  const isActive = viewStack[viewStack.length - 1]?.id === viewConfigMap.coverFlow.id;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const selectAlbum = useCallback(() => {
    if (!isActiveRef.current) return;
    
    // If we are playing, the Controls component handles the center click (toggling scrubber)
    if (playingAlbum) return;

    if (!selectedAlbum) {
      const album = albums[activeIndex];
      setSelectedAlbum(album);
    }
  }, [activeIndex, albums, selectedAlbum, playingAlbum]);

  const handleMenuClick = useCallback(() => {
    if (!isActiveRef.current) return;
    if (selectedAlbum && playingAlbum) {
      setPlayingAlbum(false);
      setHeaderTitle("Cover Flow");
    } else if (selectedAlbum) {
      setSelectedAlbum(undefined);
      setHeaderTitle("Cover Flow");
    } else {
      hideView();
    }
  }, [hideView, playingAlbum, selectedAlbum, setHeaderTitle]);

  const forwardScroll = useCallback(() => {
    if (!isActiveRef.current) return;
    
    // If playing, let VolumeHandler or Scrubber handle the scroll
    if (playingAlbum) return;

    // When album is selected, BacksideContent handles scrolling
    if (selectedAlbum) return;

    if (activeIndex < albums.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  }, [activeIndex, albums.length, playingAlbum, selectedAlbum]);

  const backwardScroll = useCallback(() => {
    if (!isActiveRef.current) return;

    // If playing, let VolumeHandler or Scrubber handle the scroll
    if (playingAlbum) return;

    // When album is selected, BacksideContent handles scrolling
    if (selectedAlbum) return;

    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  }, [activeIndex, playingAlbum, selectedAlbum]);

  const updateMidpoint = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setMidpoint({ x: width / 2, y: height / 2 });
    }
  }, []);

  useEffect(updateMidpoint, [updateMidpoint]);

  useEventListener<IpodEvent>("centerclick", selectAlbum);
  useEventListener<IpodEvent>("menuclick", handleMenuClick);
  useEventListener<IpodEvent>("forwardscroll", forwardScroll);
  useEventListener<IpodEvent>("backwardscroll", backwardScroll);

  return (
    <Container>
      <AlbumsContainer ref={containerRef}>
        {albums.map((album, index) => (
          <AlbumCover
            key={`cf-artwork-${album.id}`}
            index={index}
            activeIndex={activeIndex}
            midpoint={midpoint}
            album={album}
            playingAlbum={playingAlbum}
            isSelected={!!selectedAlbum && album.id === selectedAlbum.id}
            setPlayingAlbum={setPlayingAlbum}
          />
        ))}
      </AlbumsContainer>

      <AnimatePresence>
        {albums.length && !playingAlbum && (
          <InfoContainer {...fade}>
            <Text>{albums[activeIndex]?.name}</Text>
            <Text>{albums[activeIndex]?.artistName}</Text>
          </InfoContainer>
        )}
        {playingAlbum && (
          <NowPlayingContainer {...fade}>
            <NowPlaying hideArtwork onHide={handleMenuClick} />
          </NowPlayingContainer>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CoverFlow;