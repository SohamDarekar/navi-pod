import { SelectableList, SelectableListOption } from "components";
import { SplitScreenPreview } from "components/previews";
import { BrickGameView, viewConfigMap } from "components/views";
import { useMenuHideView, useMenuNavigation } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";

const GamesView = () => {
  useMenuHideView(viewConfigMap.games.id);
  const options: SelectableListOption[] = [
    {
      type: "view",
      label: "Brick",
      viewId: viewConfigMap.brickGame.id,
      component: () => <BrickGameView />,
      preview: SplitScreenPreview.Games,
    },
  ];

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.games.id,
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

export default GamesView;
