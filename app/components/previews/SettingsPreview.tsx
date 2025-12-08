import { motion } from "framer-motion";
import styled from "styled-components";
import { Unit } from "utils/constants";
import { IoSettingsSharp } from "react-icons/io5";

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
  margin: 0;
  font-size: 16px;
  font-weight: 500;
`;

const Subtext = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
`;

const SettingsPreview = () => {
  return (
    <Container>
      <IconWrapper>
        <IoSettingsSharp />
      </IconWrapper>
    </Container>
  );
};

export default SettingsPreview;
