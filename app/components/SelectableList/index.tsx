import { useMemo } from "react";

import { LoadingIndicator, LoadingScreen } from "components";
import ErrorScreen from "components/ErrorScreen";
import { SplitScreenPreview } from "components/previews";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";
import {
  MENU_VISIBLE_COUNT,
  MENU_ITEM_HEIGHT,
} from "utils/constants";

import SelectableListItem from "./SelectableListItem";

export const getConditionalOption = (
  condition?: boolean,
  option?: SelectableListOption
) => (option && condition ? [option] : []);

export type SelectableListOptionType =
  | "view"
  | "link"
  | "song"
  | "action"
  | "actionSheet"
  | "popup";

type SharedOptionProps = {
  type?: SelectableListOptionType;
  label: React.ReactNode;
  isSelected?: boolean;
  sublabel?: string;
  preview?: SplitScreenPreview;
  imageUrl?: string;
  longPressOptions?: SelectableListOption[];
};

type ViewOptionProps = {
  type: "view";
  viewId: string;
  component: React.ReactNode | ((...args: any) => JSX.Element);
  headerTitle?: string;
};

type LinkOptionProps = {
  type: "link";
  url: string;
};

type SongOptionProps = {
  type: "song";
  queueOptions: MediaApi.QueueOptions;
  showNowPlayingView?: boolean;
};

type ActionOptionProps = {
  type: "action";
  onSelect: () => void;
};

export type PopupOptionProps = {
  type: "popup";
  popupId: string;
  listOptions: SelectableListOption[];
  title: string;
  description?: string;
};

export type ActionSheetOptionProps = {
  type: "actionSheet";
  id: string;
  listOptions: SelectableListOption[];
};

export type SelectableListOption = SharedOptionProps &
  (
    | ViewOptionProps
    | LinkOptionProps
    | SongOptionProps
    | ActionOptionProps
    | ActionSheetOptionProps
    | PopupOptionProps
  );

/**
 * Viewport: fixed height (visibleCount * itemHeight), clips list content.
 */
const Viewport = styled.div<{ $height: number }>`
  width: 100%;
  overflow: hidden;
  position: relative;
  height: ${(props) => props.$height}px;
`;

/**
 * List moved with translateY.
 */
const ScrollableList = styled.div<{ $offset: number }>`
  width: 100%;
  transform: translateY(-${(props) => props.$offset}px);
  will-change: transform;
`;

const LoadingContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
`;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface Props {
  options: SelectableListOption[];
  activeIndex: number;
  loading?: boolean;
  loadingNextItems?: boolean;
  emptyMessage?: string;
  scrollOffset?: number; // ignored
  itemHeight?: number;
  visibleCount?: number;
}

const SelectableList = ({
  options,
  activeIndex,
  loading,
  loadingNextItems,
  emptyMessage = "Nothing to see here",
  scrollOffset,
  itemHeight = MENU_ITEM_HEIGHT,
  visibleCount,
}: Props) => {
  const effectiveVisibleCount = visibleCount ?? MENU_VISIBLE_COUNT;

  // Options we actually render, including loading row
  const fullOptions = useMemo(
    () => [
      ...options,
      ...getConditionalOption(loadingNextItems, {
        type: "action",
        label: (
          <LoadingContainer>
            <LoadingIndicator size={16} />
          </LoadingContainer>
        ),
        onSelect: () => {},
      }),
    ],
    [options, loadingNextItems]
  );

  const totalCount = fullOptions.length;

  const safeActiveIndex =
    totalCount === 0 ? 0 : clamp(activeIndex, 0, totalCount - 1);

  // Index of the first visible row.
  const maxFirstIndex = Math.max(totalCount - effectiveVisibleCount, 0);

  const firstVisibleIndex =
    totalCount <= effectiveVisibleCount
      ? 0
      : clamp(
          safeActiveIndex - effectiveVisibleCount + 1,
          0,
          maxFirstIndex
        );

  const offset = firstVisibleIndex * itemHeight;
  const viewportHeight = effectiveVisibleCount * itemHeight;

  return (
    <AnimatePresence>
      {loading ? (
        <LoadingScreen backgroundColor="white" />
      ) : options.length > 0 ? (
        <Viewport $height={viewportHeight}>
          <ScrollableList $offset={offset}>
            {fullOptions.map((option, index) => (
              <SelectableListItem
                key={`option-${index}`}
                option={option}
                isActive={index === safeActiveIndex}
              />
            ))}
          </ScrollableList>
        </Viewport>
      ) : (
        <ErrorScreen showImage={false} message={emptyMessage} />
      )}
    </AnimatePresence>
  );
};

export default SelectableList;
