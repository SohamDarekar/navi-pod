# Menu Scrolling - Testing Guide

This guide helps verify that the refactored menu scrolling system works correctly across all scenarios.

## Quick Start

1. **Build and run the application:**
   ```bash
   npm run dev
   ```

2. **Open in browser** and interact with the iPod interface

3. **Test using:**
   - Click wheel (touch/drag on the wheel)
   - Keyboard arrows (↑ ↓)
   - Mouse wheel (if browser allows on the screen area)

## Test Scenarios

### 1. Basic Navigation (All Menus)

Test each menu view individually:

**Home Menu:**
- [ ] Navigate through "Cover Flow", "Music", "Games", "Settings"
- [ ] If music is playing, "Now Playing" option appears and is selectable
- [ ] Highlight moves one item per input
- [ ] Scrolling is smooth without jumps

**Music Menu:**
- [ ] Navigate through all music options
- [ ] "Now Playing" appears when applicable
- [ ] Works when signed in and not signed in

**Settings Menu:**
- [ ] Navigate through all settings options
- [ ] About, Theme, Sign In/Out options work
- [ ] Auto Sync toggle is selectable

**Games Menu:**
- [ ] Only "Brick" game option (short list, no scrolling needed)
- [ ] Selection works correctly

**About View:**
- [ ] Two links (GitHub, LinkedIn)
- [ ] Short list behavior correct

### 2. Long Lists (Scrolling Required)

**Artists View:**
- [ ] Can scroll through all artists (if you have many)
- [ ] Scroll starts when reaching 5th item (bottom of viewport)
- [ ] Can reach the last artist
- [ ] Can scroll back up to the first artist
- [ ] No jumps or stuck scrolling

**Albums View:**
- [ ] Same scrolling behavior as Artists
- [ ] Album artwork loads and displays correctly while scrolling

**Songs View:**
- [ ] Scrolls through all songs in an album or search results
- [ ] Displays artist and album info for each song

**Playlists View:**
- [ ] Scrolls through all playlists
- [ ] Pagination works (loads more playlists when scrolling near end)

### 3. Boundary Conditions

**Top Boundary:**
- [ ] When at first item, pressing ↑ does nothing
- [ ] First item stays highlighted, no glitches
- [ ] scrollOffset remains at 0

**Bottom Boundary:**
- [ ] When at last item, pressing ↓ does nothing
- [ ] Last item stays highlighted
- [ ] scrollOffset at maxScroll

**Short Lists (< 4 items):**
- [ ] Games menu: no scrolling, just selection
- [ ] About menu: 2 items, no scrolling
- [ ] Popups with 1-2 buttons: work correctly

**Exact Fit (4 items):**
- [ ] If a menu has exactly 4 items
- [ ] All visible, no scrolling occurs
- [ ] Selection moves through all items

### 4. Dynamic Content Changes

**Now Playing Appears/Disappears:**
- [ ] Start playing a song
- [ ] "Now Playing" option appears in Home menu
- [ ] Selecting it still works
- [ ] Stop playback and menu updates

**Search Results:**
- [ ] Enter search term
- [ ] Results appear (Artists, Albums, Songs, Playlists)
- [ ] Each category is scrollable if needed
- [ ] Changing search updates the list correctly

**Playlist Pagination:**
- [ ] Scroll through a long playlist list
- [ ] When reaching halfway, more items load
- [ ] Loading indicator appears
- [ ] Can continue scrolling through new items

### 5. Special Views

**Action Sheets:**
- [ ] Long-press on a song/album to show action sheet
- [ ] Navigate through options
- [ ] "Cancel" button at bottom highlights correctly
- [ ] Selection works, closes sheet on center click

**Popups:**
- [ ] Views that show confirmation dialogs
- [ ] Navigate between "OK" / "Cancel" or similar buttons
- [ ] Selection highlights correct button
- [ ] Center click activates the highlighted button

**Keyboard Input:**
- [ ] Open search keyboard
- [ ] Navigate through all letter/number/symbol options
- [ ] Highlight moves correctly through grid
- [ ] Selecting a key enters it

**Cover Flow Backside:**
- [ ] Flip an album in Cover Flow
- [ ] Song list on back is scrollable
- [ ] Can select and play songs
- [ ] Scrolling works as expected

### 6. Visual Quality

**Smooth Scrolling:**
- [ ] List moves smoothly without jumps
- [ ] Transition animation looks natural (not too fast/slow)
- [ ] No "teleporting" of the list
- [ ] No flashing or visual glitches

**Highlight Stays Visible:**
- [ ] Selected item is ALWAYS visible on screen
- [ ] Never scrolls off the top or bottom
- [ ] Highlight gradient looks correct
- [ ] Right arrow icon shows on highlighted item

**Layout Integrity:**
- [ ] Item heights are consistent (48px)
- [ ] Images load and display correctly
- [ ] Text doesn't overflow or get cut off
- [ ] Sublabels display correctly

### 7. Input Methods

**Click Wheel:**
- [ ] Touch and drag clockwise → moves down
- [ ] Touch and drag counter-clockwise → moves up
- [ ] One notch of wheel movement = one item
- [ ] Smooth and responsive

**Keyboard:**
- [ ] ↓ arrow → moves down
- [ ] ↑ arrow → moves up
- [ ] ← arrow → moves up (alternative)
- [ ] → arrow → moves down (alternative)
- [ ] Enter → selects highlighted item
- [ ] Escape → goes back

**Mouse Wheel (if applicable):**
- [ ] Scroll down → moves selection down
- [ ] Scroll up → moves selection up
- [ ] Not too sensitive

### 8. Performance

**Large Lists:**
- [ ] Load a library with 100+ artists
- [ ] Scrolling is smooth, no lag
- [ ] No memory leaks or slowdowns

**Fast Scrolling:**
- [ ] Rapidly drag the click wheel
- [ ] Events are processed correctly
- [ ] List keeps up with input
- [ ] No race conditions or glitches

### 9. Edge Cases

**Empty Lists:**
- [ ] View with no items shows "Nothing to see here" or custom empty message
- [ ] No errors in console
- [ ] Can still navigate back

**Single Item:**
- [ ] List with one item
- [ ] Item is selected by default
- [ ] No scrolling, but selection works
- [ ] Can select the item with center click

**List Length Changes:**
- [ ] If list shrinks while at the end
- [ ] Selection resets to valid index (0)
- [ ] No crashes or out-of-bounds errors

**Navigation Stack:**
- [ ] Navigate deep into menus (Home → Music → Artists → Artist → Album)
- [ ] Each menu maintains correct scroll position
- [ ] Going back preserves previous position (if implemented)

## Regression Testing

Ensure the refactor didn't break existing features:

**Music Playback:**
- [ ] Can play a song from any menu
- [ ] Now Playing view opens correctly
- [ ] Playback controls work

**Navigation:**
- [ ] Menu button goes back
- [ ] Center button selects items
- [ ] Long press shows context menus
- [ ] Preview pane updates as you scroll (if applicable)

**Settings:**
- [ ] Theme changes work
- [ ] Sign in/out works
- [ ] Auto sync toggle works

**Search:**
- [ ] Can enter search terms
- [ ] Results display correctly
- [ ] Can navigate to results

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Device Testing

- [ ] Desktop (mouse + keyboard)
- [ ] Tablet (touch)
- [ ] Mobile (touch, smaller screen)

## Known Issues to Watch For

Based on the previous implementation, watch for these previously problematic behaviors:

❌ **Old issues that should be FIXED:**
- List jumping when scrolling past viewport
- Highlight moving but list not scrolling
- Scrolling getting stuck
- Selected item going off-screen
- Different behavior between menus
- Inconsistent scroll speed

✅ **These should all be resolved now**

## Reporting Issues

If you find a problem, note:
1. Which menu/view
2. What you did (steps to reproduce)
3. What you expected
4. What actually happened
5. Browser and device info
6. Screenshots/video if possible

## Console Errors

Keep browser console open. There should be:
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ No React warnings (except expected dev warnings)
- ✅ No "Maximum update depth exceeded" errors
- ✅ No infinite loops

## Success Criteria

The refactor is successful if:

1. ✅ Every menu scrolls smoothly and consistently
2. ✅ Selected item is ALWAYS visible
3. ✅ No visual glitches or jumps
4. ✅ Works identically across browsers and devices
5. ✅ No performance degradation
6. ✅ All existing features still work
7. ✅ Code is clean and maintainable

## Final Sign-Off

- [ ] All basic tests pass
- [ ] All edge cases handled
- [ ] No regressions found
- [ ] Performance is good
- [ ] Code is production-ready

---

**After testing, the application is ready for deployment.**
