# Menu Scrolling System - Complete Refactor Documentation

## Current Architecture Analysis

### Components Involved

1. **`useScrollHandler` hook** (`app/hooks/navigation/useScrollHandler.tsx`)
   - Maintains a `selectedIndex` state (0 to options.length-1)
   - Handles forward/backward scroll events from the click wheel
   - Dispatches events for center click, long press, etc.
   - Returns only the current index

2. **`SelectableList` component** (`app/components/SelectableList/index.tsx`)
   - Receives `activeIndex` from parent (from useScrollHandler)
   - Renders list items with `overflow-y: auto` container
   - Uses `scrollIntoView({block: "nearest"})` to keep selected item visible
   - Does NOT manage any scroll offset itself

3. **`SelectableListItem`** (`app/components/SelectableList/SelectableListItem.tsx`)
   - Fixed height: 3rem (48px) per item
   - Highlights when `isActive={true}`

4. **Input System** (`app/components/ClickWheel/index.tsx`)
   - Touch/pointer events on click wheel dispatch `forwardscroll`/`backwardscroll` events
   - Keyboard arrows also dispatch these events
   - Each scroll event increments/decrements index by 1

### Current Problems Identified

#### Problem 1: Browser scrollIntoView is Unreliable
The current system relies on the browser's native `scrollIntoView()` API with `block: "nearest"`. This approach has several issues:

- **Inconsistent behavior across browsers and devices**
- **Does not guarantee the selected item stays in a predictable position**
- **Can cause jumps when the list is longer than the viewport**
- **No control over scroll animation or timing**

#### Problem 2: No Explicit Viewport Model
There is no concept of:
- How many items are visible at once (visibleCount)
- What the viewport height should be
- Where the scroll offset should be

The container uses `overflow-y: auto` and `flex: 1`, meaning:
- Height is determined by parent layout (ScreenContainer = 260px minus header/controls)
- Actual visible count varies and is not tracked
- No explicit scroll offset calculation

#### Problem 3: CSS Layout Issues
The SelectableList container:
```css
overflow-y: auto;
flex: 1;
```

This means:
- The container expands to fill available space
- Browser handles scrolling natively
- No programmatic control over scroll position beyond scrollIntoView

#### Problem 4: No Consistent Item Height Configuration
- Item height is hardcoded in CSS (3rem = 48px)
- Not passed as a prop or configuration
- Different views might have different item heights but no system to handle this

#### Problem 5: Scroll Events Have No Accumulation/Threshold
The ClickWheel dispatches one scroll event per angular threshold (10 degrees). This is reasonable for touch, but:
- No mouse wheel delta accumulation
- No smooth scrolling support
- Each event always moves exactly 1 item (can't be tuned per device)

## Root Cause Summary

**The fundamental issue is that the scrolling system uses browser-native overflow scrolling with scrollIntoView, which is inherently unreliable and inconsistent. There is no programmatic control over scroll offset, no defined viewport model, and no way to ensure deterministic scrolling behavior.**

## Proposed Solution: Unified Scrolling Model

### Core Principles

1. **Explicit viewport model**: Define exactly how many items are visible
2. **Programmatic scroll offset**: Calculate and control scroll position directly
3. **Transform-based rendering**: Use CSS transforms instead of overflow scrolling
4. **Single source of truth**: One hook manages both selection and scroll offset
5. **Consistent across all menus**: Same logic, different configurations

### New Architecture

#### 1. `useMenuNavigation` Hook
Replaces `useScrollHandler` with a more complete implementation:

```typescript
interface MenuNavigationConfig {
  id: string;
  items: SelectableListOption[];
  itemHeight: number;
  visibleCount: number;
  selectedOption?: SelectableListOption;
  onNearEndOfList?: () => void;
}

interface MenuNavigationResult {
  selectedIndex: number;
  scrollOffset: number;
  // ... event handlers (internal)
}
```

**State managed:**
- `selectedIndex`: clamped to [0, items.length - 1]
- `scrollOffset`: calculated to keep selected item visible

**Invariants:**
- `scrollOffset` is always in [0, maxScroll]
- `maxScroll = max(0, items.length - visibleCount) * itemHeight`
- Selected item is always within visible window

**Scroll offset calculation:**
```typescript
const topVisibleIndex = Math.floor(scrollOffset / itemHeight);
const bottomVisibleIndex = topVisibleIndex + visibleCount - 1;

if (selectedIndex < topVisibleIndex) {
  scrollOffset = selectedIndex * itemHeight;
} else if (selectedIndex > bottomVisibleIndex) {
  scrollOffset = (selectedIndex - visibleCount + 1) * itemHeight;
}

scrollOffset = clamp(scrollOffset, 0, maxScroll);
```

#### 2. Updated `SelectableList` Component

```typescript
interface SelectableListProps {
  options: SelectableListOption[];
  selectedIndex: number;
  scrollOffset: number;
  itemHeight?: number;
  visibleCount?: number;
  // ...
}
```

**New CSS structure:**
```css
.menu-viewport {
  height: calc(visibleCount * itemHeight);
  overflow: hidden; /* No browser scrolling */
  position: relative;
}

.menu-list {
  transform: translateY(-scrollOffset px);
  transition: transform 0.15s ease-out; /* Smooth scroll */
}
```

#### 3. Configuration Constants

Define constants for standard menu configurations:

```typescript
export const MENU_CONFIG = {
  STANDARD: {
    itemHeight: 48, // 3rem
    visibleCount: 5, // Fits in typical viewport
  },
  COMPACT: {
    itemHeight: 40,
    visibleCount: 6,
  },
  // ... other configs
};
```

### Input Normalization

Keep the current event-based system (forwardscroll/backwardscroll) as it already works well. The key is that each event maps to exactly one logical step (moveSelection(±1)).

For future mouse wheel support, add accumulation in the ClickWheel component if needed.

## Implementation Plan

### Phase 1: Create New Hook (useMenuNavigation)
- [ ] Implement core logic with selectedIndex and scrollOffset state
- [ ] Add scroll offset calculation based on selectedIndex changes
- [ ] Implement clamping for both index and offset
- [ ] Preserve all existing event handlers from useScrollHandler
- [ ] Add comprehensive comments

### Phase 2: Update SelectableList Component
- [ ] Add scrollOffset and itemHeight props
- [ ] Change CSS from overflow scrolling to fixed viewport with transform
- [ ] Remove scrollIntoView logic
- [ ] Add smooth transition for scrollOffset changes
- [ ] Ensure visual design remains identical

### Phase 3: Update All Menu Views
- [ ] Update each view to use new hook
- [ ] Configure itemHeight and visibleCount per view
- [ ] Test each menu individually

### Phase 4: Handle Edge Cases
- [ ] Menus with fewer items than visibleCount (no scrolling needed)
- [ ] Dynamic list length changes (data loading, filtering)
- [ ] Popup/ActionSheet/Keyboard views (different layouts)

### Phase 5: Testing
- [ ] Test all menu types
- [ ] Test with various list lengths (0, 1, exact visible, more than visible)
- [ ] Test boundary conditions (top/bottom)
- [ ] Test on different devices/browsers
- [ ] Verify no visual regressions

## Technical Details

### Calculating Visible Count
Given ScreenContainer height of 260px:
- Minus Header (≈30px)
- Minus Controls at bottom (≈40px)
- Remaining ≈190px for menu
- At 48px per item: 190/48 ≈ 3.95 → use 4 visible items

Need to measure actual available height in different contexts.

### Scroll Offset Behavior Examples

**Example 1: List with 10 items, 4 visible**
- Selected index 0: scrollOffset = 0
- Selected index 1: scrollOffset = 0
- Selected index 2: scrollOffset = 0
- Selected index 3: scrollOffset = 0 (all still visible)
- Selected index 4: scrollOffset = 48 (scroll down 1 item, keep item 4 at bottom)
- Selected index 9: scrollOffset = 6 * 48 = 288 (maxScroll)

**Example 2: List with 3 items, 4 visible**
- No scrolling occurs, scrollOffset always 0

## Success Criteria

After implementation:
- ✅ Every menu scrolls consistently
- ✅ Selected item is always visible without jumps
- ✅ Behavior is identical across all devices
- ✅ No overshooting or stuck scrolling
- ✅ Clean, maintainable codebase
- ✅ Visual design unchanged
