import { useCallback, useEffect } from "react";

import { Controls } from "components";
import { useAudioPlayer, useEffectOnce, useEventListener, useViewContext } from "hooks";
import styled from "styled-components";
import { Unit } from "utils/constants";
import * as Utils from "utils";
import { IpodEvent } from "utils/events";
import viewConfigMap from "components/views";

const Container = styled.div`
  height: 100%;
  overflow: hidden;
`;

const MetadataContainer = styled.div`
  display: flex;
  height: 70%;
  padding: 0 ${Unit.XS};
`;

interface ArtworkContainerProps {
  $isHidden?: boolean;
}

const ArtworkContainer = styled.div<ArtworkContainerProps>`
  height: 8em;
  width: 8em;
  margin: auto ${Unit.SM};
  -webkit-box-reflect: below 0px -webkit-gradient(linear, left top, left bottom, from(transparent), color-stop(70%, transparent), to(rgba(250, 250, 250, 0.1)));
  transform-style: preserve-3d;
  perspective: 500px;
  opacity: ${(props) => props.$isHidden && 0};
`;

const Artwork = styled.img`
  height: 100%;
  width: 100%;
  transform: rotateY(18deg);
  border: 1px solid #f3f3f3;
`;

const InfoContainer = styled.div`
  flex: 1;
  margin: auto 0 auto clamp(0.5rem, 5vw, 0.5rem);
`;

const Text = styled.h3`
  margin: 0;
  font-size: 0.92rem;
`;

const Subtext = styled(Text)`
  color: rgb(99, 101, 103);
  font-size: 0.75rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  height: 30%;
`;

interface Props {
  hideArtwork?: boolean;
  onHide: () => void;
}

const NowPlaying = ({ hideArtwork, onHide }: Props) => {
  const { nowPlayingItem, playbackInfo, updateNowPlayingItem, updatePlaybackInfo, isLooping, toggleLoop, playNext, addToQueue } =
    useAudioPlayer();
  const { showView } = useViewContext();

  useEffectOnce(() => {
    updateNowPlayingItem();
    updatePlaybackInfo();
  });

  // Handle playback completion
  useEffect(() => {
    if (!playbackInfo.isPlaying && !playbackInfo.isPaused && !playbackInfo.isLoading && !nowPlayingItem) {
      onHide();
    }
  }, [playbackInfo, nowPlayingItem, onHide]);

  // Handle center button long press to show action sheet
  const handleCenterLongClick = useCallback(() => {
    if (!nowPlayingItem) return;

    showView({
      type: "actionSheet",
      id: viewConfigMap.mediaActionSheet.id,
      listOptions: [
        {
          type: "action",
          label: isLooping ? "Loop: On" : "Loop: Off",
          isSelected: isLooping,
          onSelect: toggleLoop,
        },
        {
          type: "action",
          label: "Shuffle",
          onSelect: () => {
            // Shuffle functionality can be added later if needed
            console.log("Shuffle not yet implemented in Now Playing");
          },
        },
        {
          type: "action",
          label: "Play Next",
          onSelect: () => {
            if (nowPlayingItem) {
              playNext({ song: nowPlayingItem as MediaApi.Song });
            }
          },
        },
        {
          type: "action",
          label: "Add to Queue",
          onSelect: () => {
            if (nowPlayingItem) {
              addToQueue({ song: nowPlayingItem as MediaApi.Song });
            }
          },
        },
      ],
    });
  }, [nowPlayingItem, isLooping, toggleLoop, showView, playNext, addToQueue]);

  useEventListener<IpodEvent>("centerlongclick", handleCenterLongClick);

  const artworkUrl = Utils.getArtwork(300, nowPlayingItem?.artwork?.url);

  return (
    <Container>
      <MetadataContainer>
        <ArtworkContainer $isHidden={hideArtwork}>
          <Artwork src={artworkUrl} />
        </ArtworkContainer>
        <InfoContainer>
          <Text>{nowPlayingItem?.name}</Text>
          <Subtext>{nowPlayingItem?.artistName}</Subtext>
          <Subtext>{nowPlayingItem?.albumName}</Subtext>
        </InfoContainer>
      </MetadataContainer>
      <ControlsContainer>
        <Controls />
      </ControlsContainer>
    </Container>
  );
};

export default NowPlaying;
