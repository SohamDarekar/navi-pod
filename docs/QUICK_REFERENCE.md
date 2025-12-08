# Menu Navigation - Quick Reference

## Creating a New Scrollable Menu

```typescript
import { SelectableList, SelectableListOption } from "components";
import { useMenuNavigation, useMenuHideView } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import { viewConfigMap } from "components/views";

const MyNewView = () => {
  // Enable back button
  useMenuHideView(viewConfigMap.myView.id);
  
  // Define menu items
  const options: SelectableListOption[] = [
    {
      type: "view",
      label: "Item 1",
      viewId: viewConfigMap.someView.id,
      component: () => <SomeView />,
    },
    // ... more items
  ];

  // Hook for navigation and scrolling
  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.myView.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return (
    <SelectableList
      options={options}
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
    />
  );
};
```

## Configuration Options

### Standard Config (Most menus)
```typescript
import { MENU_CONFIG_STANDARD } from "utils/constants";

const { selectedIndex, scrollOffset } = useMenuNavigation({
  id: viewConfigMap.myView.id,
  items: options,
  ...MENU_CONFIG_STANDARD, // itemHeight: 48, visibleCount: 4
});
```

### Large Config (More vertical space)
```typescript
import { MENU_CONFIG_LARGE } from "utils/constants";

const { selectedIndex, scrollOffset } = useMenuNavigation({
  id: viewConfigMap.myView.id,
  items: options,
  ...MENU_CONFIG_LARGE, // itemHeight: 48, visibleCount: 5
});
```

### Custom Config
```typescript
const { selectedIndex, scrollOffset } = useMenuNavigation({
  id: viewConfigMap.myView.id,
  items: options,
  itemHeight: 40,
  visibleCount: 6,
});
```

### With Pagination
```typescript
const { selectedIndex, scrollOffset } = useMenuNavigation({
  id: viewConfigMap.myView.id,
  items: options,
  ...MENU_CONFIG_STANDARD,
  onNearEndOfList: () => {
    // Called when user scrolls halfway through list
    fetchNextPage();
  },
});
```

### With Initial Selection
```typescript
const selectedItem = options.find(o => o.isSelected);

const { selectedIndex, scrollOffset } = useMenuNavigation({
  id: viewConfigMap.myView.id,
  items: options,
  selectedOption: selectedItem,
  ...MENU_CONFIG_STANDARD,
});
```

## SelectableListOption Types

### View Option (Navigate to another view)
```typescript
{
  type: "view",
  label: "Albums",
  viewId: viewConfigMap.albums.id,
  component: () => <AlbumsView />,
  headerTitle: "Albums",
  preview: SplitScreenPreview.Music,
  imageUrl: "/albums_icon.svg",
  sublabel: "50 albums",
}
```

### Song Option (Play music)
```typescript
{
  type: "song",
  label: "Song Name",
  sublabel: "Artist Name",
  imageUrl: artwork.url,
  queueOptions: { album, startPosition: 0 },
  showNowPlayingView: true,
  longPressOptions: [...contextMenu],
}
```

### Action Option (Execute function)
```typescript
{
  type: "action",
  label: "Sign Out",
  onSelect: () => handleSignOut(),
}
```

### Link Option (Open URL)
```typescript
{
  type: "link",
  label: "GitHub",
  url: "https://github.com/username",
}
```

### Action Sheet Option (Show action sheet)
```typescript
{
  type: "actionSheet",
  id: "media-actions",
  listOptions: [...actionOptions],
}
```

### Popup Option (Show popup dialog)
```typescript
{
  type: "popup",
  popupId: "confirm-delete",
  title: "Delete?",
  description: "This cannot be undone",
  listOptions: [
    { type: "action", label: "Delete", onSelect: handleDelete },
    { type: "action", label: "Cancel", onSelect: () => {} },
  ],
}
```

## Constants

```typescript
// From utils/constants/menu
MENU_ITEM_HEIGHT = 48          // Standard item height
MENU_VISIBLE_COUNT = 4         // Standard visible items
MENU_CONFIG_STANDARD = {
  itemHeight: 48,
  visibleCount: 4,
}
```

## Hook Return Values

```typescript
const {
  selectedIndex,  // 0-based index of selected item
  scrollOffset,   // Pixel offset for list (for CSS transform)
  maxScroll,      // Maximum scroll offset
} = useMenuNavigation({...});
```

## Scroll Behavior

- **Automatic**: Scroll offset calculated automatically when selection changes
- **Smooth**: CSS transition on transform (0.15s ease-out)
- **Bounded**: Always clamped to valid range [0, maxScroll]
- **Visible**: Selected item always stays within viewport

## Common Patterns

### Loading State
```typescript
<SelectableList
  loading={isLoading}
  options={options}
  activeIndex={selectedIndex}
  scrollOffset={scrollOffset}
  itemHeight={MENU_CONFIG_STANDARD.itemHeight}
  visibleCount={MENU_CONFIG_STANDARD.visibleCount}
/>
```

### Empty State
```typescript
<SelectableList
  options={options}
  activeIndex={selectedIndex}
  scrollOffset={scrollOffset}
  itemHeight={MENU_CONFIG_STANDARD.itemHeight}
  visibleCount={MENU_CONFIG_STANDARD.visibleCount}
  emptyMessage="No items found"
/>
```

### Pagination Loading
```typescript
<SelectableList
  options={options}
  loadingNextItems={isFetchingNextPage}
  activeIndex={selectedIndex}
  scrollOffset={scrollOffset}
  itemHeight={MENU_CONFIG_STANDARD.itemHeight}
  visibleCount={MENU_CONFIG_STANDARD.visibleCount}
/>
```

### Auth Prompt Fallback
```typescript
return isAuthorized ? (
  <SelectableList
    options={options}
    activeIndex={selectedIndex}
    scrollOffset={scrollOffset}
    itemHeight={MENU_CONFIG_STANDARD.itemHeight}
    visibleCount={MENU_CONFIG_STANDARD.visibleCount}
  />
) : (
  <AuthPrompt message="Sign in to continue" />
);
```

## Debugging Tips

### Check scroll state in React DevTools
```typescript
// In component:
console.log('Selected:', selectedIndex, 'Scroll:', scrollOffset, 'Max:', maxScroll);
```

### Verify item count vs visible count
```typescript
console.log('Items:', options.length, 'Visible:', MENU_CONFIG_STANDARD.visibleCount);
```

### Check if scrolling should occur
```typescript
const shouldScroll = options.length > MENU_CONFIG_STANDARD.visibleCount;
console.log('Should scroll:', shouldScroll);
```

## Common Issues

❌ **List not scrolling**
- Check that `scrollOffset` prop is passed to SelectableList
- Verify `options.length > visibleCount`
- Confirm `itemHeight` and `visibleCount` are passed

❌ **Jumpy scrolling**
- Make sure all items have consistent height (48px)
- Check CSS doesn't override transform or transition

❌ **Selected item off-screen**
- Verify `scrollOffset` calculation in useMenuNavigation
- Check that viewport height is correctly set

❌ **Wrong initial position**
- Pass `selectedOption` to useMenuNavigation if needed
- Check initial index calculation

## Performance Notes

- Transform-based scrolling is GPU-accelerated
- No browser repaint/reflow during scroll
- Efficient for lists with 100+ items
- Consider virtualizing for 1000+ items (future enhancement)

## Migration from Old System

If you see `useScrollHandler`:
1. Replace with `useMenuNavigation`
2. Add `scrollOffset` to SelectableList props
3. Add `itemHeight` and `visibleCount` props
4. Test scrolling behavior

## Further Reading

- `docs/MENU_SCROLLING_REFACTOR.md` - Technical design
- `docs/IMPLEMENTATION_SUMMARY.md` - What changed
- `docs/TESTING_GUIDE.md` - Testing checklist
- `app/hooks/navigation/useMenuNavigation.tsx` - Source code with detailed comments
