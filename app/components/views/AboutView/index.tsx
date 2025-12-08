import { SelectableList, SelectableListOption } from "components";
import { viewConfigMap } from "components/views";
import { useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import styled from "styled-components";
import { Unit } from "utils/constants";

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${Unit.MD} ${Unit.MD} 0;
  font-size: 48px;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${Unit.XS};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 900;
`;

const Description = styled.h3`
  margin: 0 0 ${Unit.MD};
  font-size: 14px;
  font-weight: normal;
  text-align: center;
`;

const ListContainer = styled.div`
  flex: 1;
`;

const AboutView = () => {
  useMenuHideView(viewConfigMap.about.id);
  const options: SelectableListOption[] = [
    {
      type: "link",
      label: "GitHub",
      url: "https://github.com/SohamDarekar",
    },
    {
      type: "link",
      label: "LinkedIn",
      url: "https://linkedin.com/in/sohamdarekar",
    },
  ];

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.about.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return (
    <Container>
      <ListContainer>
        <IconContainer>
          🎵
        </IconContainer>
        <TitleContainer>
          <Title>NaviPod</Title>
        </TitleContainer>
        <Description>
          Developer: Soham Darekar
        </Description>
        <SelectableList
          options={options}
          activeIndex={selectedIndex}
          scrollOffset={scrollOffset}
          itemHeight={MENU_CONFIG_STANDARD.itemHeight}
          visibleCount={MENU_CONFIG_STANDARD.visibleCount}
        />
      </ListContainer>
    </Container>
  );
};

export default AboutView;
