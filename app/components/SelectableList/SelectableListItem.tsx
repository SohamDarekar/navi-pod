import styled, { css } from "styled-components";
import { Unit, MENU_ITEM_HEIGHT } from "utils/constants";
import { SelectableListOption } from ".";
import { APP_URL } from "utils/constants/api";

const LabelContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* Allow text truncation */
  padding-right: ${Unit.MD};
`;

const Label = styled.h3`
  margin: 0;
  padding: 0 ${Unit.XS};
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Sublabel = styled.h4`
  margin: 0;
  padding: 0 ${Unit.XS};
  margin-top: 2px;
  font-weight: normal;
  font-size: 12px;
  line-height: 1.2;
  color: rgb(100, 100, 100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Container = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  overflow: hidden;
  height: ${MENU_ITEM_HEIGHT}px;        /* <- FIXED ROW HEIGHT (48px) */
  padding: 0 ${Unit.XS};
  box-sizing: border-box;
  transition: background 0.1s ease;

  ${(props) =>
    props.$isActive &&
    css`
      ${LabelContainer} {
        padding-right: ${Unit.XS};
      }

      ${Label}, ${Sublabel} {
        color: white;
      }

      background: linear-gradient(
        rgb(60, 184, 255) 0%,
        rgb(52, 122, 181) 100%
      );
    `};
`;

const Image = styled.img`
  height: 2.5rem; /* 40px - slightly smaller for better proportions */
  width: 2.5rem;
  margin-right: ${Unit.SM};
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
`;

const Icon = styled.img`
  height: 0.75rem; /* 12px */
  width: 0.75rem;
  margin-left: ${Unit.XS};
  flex-shrink: 0;
`;

interface Props {
  option: SelectableListOption;
  isActive: boolean;
}

const SelectableListItem = ({ option, isActive }: Props) => {
  return (
    <Container $isActive={isActive}>
      {option.imageUrl && <Image alt="List item" src={option.imageUrl} />}
      <LabelContainer>
        <Label>{option.label}</Label>
        {option.sublabel && <Sublabel>{option.sublabel}</Sublabel>}
      </LabelContainer>
      {isActive && <Icon src={`${APP_URL}/arrow_right.svg`} />}
    </Container>
  );
};

export default SelectableListItem;
