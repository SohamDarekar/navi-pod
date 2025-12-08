import { Header } from "components";
import View from "components/ViewManager/components/View";
import { AnimatePresence } from "framer-motion";
import { ViewOptions } from "providers/ViewContextProvider";
import styled from "styled-components";
import { MENU_ITEM_HEIGHT, MENU_VISIBLE_COUNT } from "utils/constants";

interface ContainerProps {
  $isHidden: boolean;
}

const Container = styled.div<ContainerProps>`
  z-index: 3;
  display: grid;
  grid-template-rows: 20px 1fr;
  position: absolute;
  height: 100%;
  width: 100%;
  background: white;
  transition: all 0.35s;
  transform: ${(props) => props.$isHidden && "translateX(100%)"};
`;

const ContentContainer = styled.div`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: ${MENU_ITEM_HEIGHT * MENU_VISIBLE_COUNT}px;
`;

interface Props {
  viewStack: ViewOptions[];
}

const FullScreenViewManager = ({ viewStack }: Props) => {
  const isHidden = viewStack.length === 0;

  return (
    <Container data-stack-type="fullscreen" $isHidden={isHidden}>
      <Header />
      <ContentContainer>
        <AnimatePresence>
          {viewStack.map((view, index) => (
            <View
              key={`view-${view.id}`}
              viewStack={viewStack}
              index={index}
              isHidden={index < viewStack.length - 1}
            />
          ))}
        </AnimatePresence>
      </ContentContainer>
    </Container>
  );
};

export default FullScreenViewManager;
