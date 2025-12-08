/**
 * Menu Configuration Constants
 * 
 * Defines standard configurations for menu scrolling behavior across the iPod interface.
 * All measurements are in pixels.
 */

/**
 * Standard item height for most menus
 * Matches the CSS height in SelectableListItem (3rem = 48px)
 */
export const MENU_ITEM_HEIGHT = 48;

/**
 * Compact item height for smaller menus (if needed in future)
 */
export const MENU_ITEM_HEIGHT_COMPACT = 40;

/**
 * Standard number of visible items in the main menu viewport
 * 
 * Calculation:
 * - ScreenContainer height: 260px
 * - Header height: ~20px
 * - Controls height: ~40px (when visible, at bottom)
 * - Remaining: ~200px
 * - At 48px per item: 200 / 48 ≈ 4.16
 * - Use 4 for consistency, with some margin
 */
export const MENU_VISIBLE_COUNT = 5;

/**
 * For full-screen menus (like Settings) that might have more vertical space
 */
export const MENU_VISIBLE_COUNT_LARGE = 5;

/**
 * Standard menu configuration
 */
export const MENU_CONFIG_STANDARD = {
  itemHeight: MENU_ITEM_HEIGHT,
  visibleCount: MENU_VISIBLE_COUNT,
};

/**
 * Configuration for menus with more vertical space
 */
export const MENU_CONFIG_LARGE = {
  itemHeight: MENU_ITEM_HEIGHT,
  visibleCount: MENU_VISIBLE_COUNT_LARGE,
};

/**
 * Configuration for compact menus (future use)
 */
export const MENU_CONFIG_COMPACT = {
  itemHeight: MENU_ITEM_HEIGHT_COMPACT,
  visibleCount: 5,
};
