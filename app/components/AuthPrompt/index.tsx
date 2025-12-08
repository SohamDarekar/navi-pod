import styled from "styled-components";
import { Unit } from "utils/constants";

const RootContainer = styled.div`
  display: grid;
  place-content: center;
  text-align: center;
  height: 100%;
  background: white;
`;

const IconContainer = styled.div`
  position: relative;
  height: 60px;
  width: 60px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
`;

const Title = styled.h3`
  margin: ${Unit.XS} 0 ${Unit.XXS};
  font-weight: bold;
  font-size: 18px;
`;

const Text = styled.p`
  font-size: 14px;
  margin: 0;
  max-width: 140px;
  color: rgb(100, 100, 100);
`;

const strings = {
  title: "NaviPod",
  defaultMessage: "Sign in via Settings to access your Navidrome library",
};

interface Props {
  message?: string;
}

const AuthPrompt = ({ message }: Props) => {
  return (
    <RootContainer>
      <IconContainer>
        🎵
      </IconContainer>
      <Title>{strings.title}</Title>
      <Text>{message ?? strings.defaultMessage}</Text>
    </RootContainer>
  );
};

export default AuthPrompt;
