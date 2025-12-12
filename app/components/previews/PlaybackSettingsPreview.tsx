import { motion } from "framer-motion";
import styled from "styled-components";
import { Unit } from "utils/constants";
import { IoMusicalNotesSharp } from "react-icons/io5";
import { usePlaybackQuality } from "hooks";

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  background: #808080;
`;

const IconWrapper = styled.div`
  margin-bottom: ${Unit.XS};
  font-size: 64px;
`;

const Text = styled.h3`
  margin: ${Unit.XS} 0;
  font-size: 16px;
  font-weight: 500;
`;

const Subtext = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
`;

const PlaybackSettingsPreview = () => {
  const { quality } = usePlaybackQuality();

  const getQualityLabel = () => {
    switch (quality) {
      case "raw":
        return "Raw (FLAC)";
      case "mp3":
        return "MP3";
      case "opus":
        return "Opus";
      default:
        return quality;
    }
  };

  return (
    <Container>
      <IconWrapper>
        <IoMusicalNotesSharp />
      </IconWrapper>
      <Text>Playback</Text>
      <Subtext>{getQualityLabel()}</Subtext>
    </Container>
  );
};

export default PlaybackSettingsPreview;
