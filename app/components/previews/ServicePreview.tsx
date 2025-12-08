import { motion } from "framer-motion";
import { useSettings } from "hooks";
import styled from "styled-components";
import { Unit } from "utils/constants";

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  background: linear-gradient(180deg, #b1b5c0 0%, #686e7a 100%);
`;

const Icon = styled.div`
  font-size: 4em;
  margin: ${Unit.XS};
`;

const Text = styled.h3`
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
`;

const Subtext = styled(Text)`
  font-size: 14px;
  font-weight: 400;
`;

const ServicePreview = () => {
  const { isAuthorized } = useSettings();

  return (
    <Container>
      <Icon>🎵</Icon>
      <Text>{isAuthorized ? "Navidrome" : "Not Connected"}</Text>
      <Subtext>{isAuthorized ? "Connected" : "Sign in via Settings"}</Subtext>
    </Container>
  );
};

export default ServicePreview;
