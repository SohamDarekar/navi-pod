import { useCallback, useRef, useState } from "react";

import { useEventListener, useViewContext, useVolumeHandler } from "hooks";
import styled from "styled-components";
import { Unit } from "utils/constants";

import Scrubber from "./Scrubber";
import TrackProgress from "./TrackProgress";
import VolumeBar from "./VolumeBar";
import { IpodEvent } from "utils/events";
import viewConfigMap from "components/views";

const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 0 ${Unit.MD} ${Unit.MD};
`;

interface ContainerProps {
  $isHidden: boolean;
}

const MainContainer = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${Unit.XS};
  right: ${Unit.XS};
  transition: transform 0.3s;

  transform: ${(props) => props.$isHidden && "translateX(-110%)"};
`;

const ScrubberContainer = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${Unit.XS};
  right: ${Unit.XS};
  transition: transform 0.3s;

  transform: ${(props) => props.$isHidden && "translateX(110%)"};
`;

const Controls = () => {
  const { volume, active, setEnabled } = useVolumeHandler();
  const { viewStack } = useViewContext();
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Check if the current view is either Now Playing OR Cover Flow
  const currentViewId = viewStack[viewStack.length - 1]?.id;
  const isControlsActive = currentViewId === viewConfigMap.nowPlaying.id || currentViewId === viewConfigMap.coverFlow.id;
  
  const isControlsActiveRef = useRef(isControlsActive);
  isControlsActiveRef.current = isControlsActive;

  const handleCenterClick = useCallback(() => {
    // Only handle center click if we are in a view that uses these controls
    if (!isControlsActiveRef.current) return;
    
    if (isScrubbing) {
      // Enable the volume controls.
      setEnabled(true);
      setIsScrubbing(false);
    } else {
      // Disable the volume controls.
      setEnabled(false);
      setIsScrubbing(true);
    }
  }, [isScrubbing, setEnabled]);

  useEventListener<IpodEvent>("centerclick", handleCenterClick);

  return (
    <Container>
      <MainContainer $isHidden={isScrubbing}>
        {active && !isScrubbing && <VolumeBar percent={volume * 100} />}
      </MainContainer>
      <MainContainer $isHidden={isScrubbing}>
        <TrackProgress />
      </MainContainer>
      <ScrubberContainer $isHidden={!isScrubbing}>
        <Scrubber isScrubbing={isScrubbing} />
      </ScrubberContainer>
    </Container>
  );
};

export default Controls;