/**
 * useMenuNavigation - Unified Menu Scrolling System
 * 
 * This hook provides a complete, deterministic scrolling system for all menus in the iPod interface.
 * It replaces the previous scrollIntoView-based approach with a programmatic scroll offset model.
 * 
 * Core Concepts:
 * - selectedIndex: The currently highlighted item (0 to items.length - 1)
 * - scrollOffset: Pixel offset for the list container (controls what's visible)
 * - itemHeight: Height of each list item in pixels
 * - visibleCount: Number of items visible in the viewport at once
 * 
 * Invariants:
 * - selectedIndex is always clamped to [0, items.length - 1]
 * - scrollOffset is always clamped to [0, maxScroll]
 * - maxScroll = max(0, (items.length - visibleCount) * itemHeight)
 * - The selected item is always within the visible viewport
 * 
 * Scroll Behavior:
 * - When moving down and selected item would go below bottom of viewport, scroll down
 * - When moving up and selected item would go above top of viewport, scroll up
 * - Scrolling is smooth and predictable, one item at a time
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActionSheetOptionProps,
  PopupOptionProps,
  SelectableListOption,
} from "components";
import viewConfigMap, { NowPlayingView } from "components/views";
import useHapticFeedback from "hooks/useHapticFeedback";
import { IpodEvent } from "utils/events";

import {
  useAudioPlayer,
  useEffectOnce,
  useEventListener,
  useViewContext,
} from "hooks";

/**
 * Configuration for menu navigation behavior
 */
export interface MenuNavigationConfig {
  /** Unique ID for this menu (should match viewId) */
  id: string;
  /** List of menu items */
  items: SelectableListOption[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items visible in viewport at once */
  visibleCount: number;
  /** Optional: initially selected item */
  selectedOption?: SelectableListOption;
  /** Optional: callback when user scrolls near end of list (for pagination) */
  onNearEndOfList?: (currentLength: number) => void;
}

/**
 * Result of menu navigation hook
 */
export interface MenuNavigationResult {
  /** Current selected index (0-based) */
  selectedIndex: number;
  /** Current scroll offset in pixels */
  scrollOffset: number;
  /** Maximum possible scroll offset */
  maxScroll: number;
}

/**
 * Utility: Clamp a value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

/**
 * Calculate initial selected index from options and selected option
 */
const getInitialIndex = (
  items: SelectableListOption[],
  selectedOption?: SelectableListOption
): number => {
  if (selectedOption) {
    const index = items.findIndex((item) => item === selectedOption);
    if (index > -1) {
      return index;
    }
  }
  return 0;
};

/**
 * Calculate scroll offset to keep selected item visible
 * 
 * Strategy:
 * - Always ensure the selected item is visible in the viewport
 * - Scroll minimally - only when item goes out of view
 * - Position at top when scrolling up, at bottom when scrolling down
 */
const calculateScrollOffset = (
  selectedIndex: number,
  itemHeight: number,
  visibleCount: number,
  itemsLength: number,
  currentScrollOffset: number
): number => {
  // Calculate max scroll (can't scroll past the last page)
  const maxScroll = Math.max(0, (itemsLength - visibleCount) * itemHeight);

  // If the entire list fits in the viewport, no need to scroll
  if (maxScroll === 0) {
    return 0;
  }

  // Calculate the item's position in pixels
  const itemTopPosition = selectedIndex * itemHeight;
  const itemBottomPosition = itemTopPosition + itemHeight;

  // Calculate viewport boundaries
  const viewportTop = currentScrollOffset;
  const viewportBottom = currentScrollOffset + (visibleCount * itemHeight);

  let newScrollOffset = currentScrollOffset;

  // If item is above viewport, scroll up to show it at top
  if (itemTopPosition < viewportTop) {
    newScrollOffset = itemTopPosition;
  }
  // If item is below viewport, scroll down to show it at bottom
  else if (itemBottomPosition > viewportBottom) {
    newScrollOffset = itemBottomPosition - (visibleCount * itemHeight);
  }
  // Otherwise item is visible, don't change scroll

  // Clamp to valid range
  return clamp(newScrollOffset, 0, maxScroll);
};

/**
 * Main hook for menu navigation with unified scrolling
 */
const useMenuNavigation = ({
  id,
  items,
  itemHeight,
  visibleCount,
  selectedOption,
  onNearEndOfList,
}: MenuNavigationConfig): MenuNavigationResult => {
  const { triggerHaptics } = useHapticFeedback();
  const { showView, viewStack, setPreview } = useViewContext();
  const { play } = useAudioPlayer();

  // State: selected index and scroll offset
  const [selectedIndex, setSelectedIndex] = useState(() =>
    getInitialIndex(items, selectedOption)
  );
  const [scrollOffset, setScrollOffset] = useState(0);

  // Refs for stable access in callbacks
  const timeoutIdRef = useRef<NodeJS.Timeout>();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const scrollOffsetRef = useRef(scrollOffset);
  scrollOffsetRef.current = scrollOffset;

  // Track if this view is active (top of stack)
  const topView = viewStack?.[viewStack.length - 1];
  const isActive = topView?.id === id;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  // Calculate max scroll based on current items
  const maxScroll = Math.max(0, (items.length - visibleCount) * itemHeight);

  /**
   * Update scroll offset when selected index changes
   */
  useEffect(() => {
    const newScrollOffset = calculateScrollOffset(
      selectedIndex,
      itemHeight,
      visibleCount,
      items.length,
      scrollOffsetRef.current
    );
    setScrollOffset(newScrollOffset);
  }, [selectedIndex, itemHeight, visibleCount, items.length]);

  /**
   * Handle preview display after user stops scrolling
   */
  const handleCheckForPreview = useCallback(
    (index: number) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (!isActive || !items[index]) return;

      timeoutIdRef.current = setTimeout(() => {
        const preview = items[index].preview;
        if (preview) {
          setPreview(preview);
        }
      }, 750);

      return () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
      };
    },
    [isActive, items, setPreview]
  );

  /**
   * Move selection forward (down) by one item
   */
  const handleForwardScroll = useCallback(() => {
    if (!isActiveRef.current) return;

    setSelectedIndex((prevIndex) => {
      const currentItems = itemsRef.current;
      if (prevIndex < currentItems.length - 1) {
        const newIndex = prevIndex + 1;
        triggerHaptics(10);
        handleCheckForPreview(newIndex);

        // Trigger pagination callback halfway through list
        if (newIndex === Math.round(currentItems.length / 2)) {
          onNearEndOfList?.(currentItems.length);
        }

        return newIndex;
      }
      return prevIndex;
    });
  }, [handleCheckForPreview, onNearEndOfList, triggerHaptics]);

  /**
   * Move selection backward (up) by one item
   */
  const handleBackwardScroll = useCallback(() => {
    if (!isActiveRef.current) return;

    setSelectedIndex((prevIndex) => {
      if (prevIndex > 0) {
        const newIndex = prevIndex - 1;
        triggerHaptics(10);
        handleCheckForPreview(newIndex);
        return newIndex;
      }
      return prevIndex;
    });
  }, [handleCheckForPreview, triggerHaptics]);

  /**
   * Helper to show a new view
   */
  const handleShowView = useCallback(
    (
      viewId: string,
      component: React.ReactNode | ((...args: any) => JSX.Element),
      headerTitle?: string
    ) => {
      showView({
        id: viewId,
        type: viewConfigMap[viewId]?.type as any,
        component,
        headerTitle,
      });
    },
    [showView]
  );

  /**
   * Helper to show a popup
   */
  const handleShowPopup = useCallback(
    (options: PopupOptionProps) => {
      showView({
        type: "popup",
        id: options.popupId,
        title: options.title,
        description: options.description,
        listOptions: options.listOptions,
      });
    },
    [showView]
  );

  /**
   * Helper to show an action sheet
   */
  const handleShowActionSheet = useCallback(
    (options: ActionSheetOptionProps) => {
      showView({
        type: "actionSheet",
        id: options.id,
        listOptions: options.listOptions,
      });
    },
    [showView]
  );

  /**
   * Handle center button click (select current item)
   */
  const handleCenterClick = useCallback(async () => {
    if (!isActiveRef.current) return;

    const currentItems = itemsRef.current;
    const option = currentItems[selectedIndex];
    if (!option) return;

    triggerHaptics(10);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    switch (option.type) {
      case "song":
        await play(option.queueOptions);
        if (option.showNowPlayingView) {
          handleShowView(viewConfigMap.nowPlaying.id, () => <NowPlayingView />);
        }
        break;
      case "link":
        window.open(option.url, "_blank");
        break;
      case "view":
        handleShowView(option.viewId, option.component, option.headerTitle);
        break;
      case "action":
        option.onSelect();
        break;
      case "popup":
        handleShowPopup(option);
        break;
      case "actionSheet":
        handleShowActionSheet(option);
        break;
    }
  }, [
    selectedIndex,
    handleShowActionSheet,
    handleShowPopup,
    handleShowView,
    play,
    triggerHaptics,
  ]);

  /**
   * Handle center button long press (show context menu)
   */
  const handleCenterLongClick = useCallback(async () => {
    if (!isActiveRef.current) return;

    const currentItems = itemsRef.current;
    const option = currentItems[selectedIndex];
    if (!option || !option.longPressOptions) return;

    showView({
      type: "actionSheet",
      id: viewConfigMap.mediaActionSheet.id,
      listOptions: option.longPressOptions,
    });
  }, [selectedIndex, showView]);

  /**
   * Reset selection to 0 if list shrinks and current index is out of bounds
   */
  useEffect(() => {
    if (items.length > 0 && selectedIndex > items.length - 1) {
      setSelectedIndex(0);
      setScrollOffset(0);
    }
  }, [items.length, selectedIndex]);

  /**
   * Show preview for initial item
   */
  useEffectOnce(() => {
    if (!items || !items[0]) return;

    const preview = items[0].preview;
    if (preview) {
      setPreview(preview);
    }
  });

  // Listen to iPod events
  useEventListener<IpodEvent>("centerclick", handleCenterClick);
  useEventListener<IpodEvent>("centerlongclick", handleCenterLongClick);
  useEventListener<IpodEvent>("forwardscroll", handleForwardScroll);
  useEventListener<IpodEvent>("backwardscroll", handleBackwardScroll);

  return {
    selectedIndex,
    scrollOffset,
    maxScroll,
  };
};

export default useMenuNavigation;
