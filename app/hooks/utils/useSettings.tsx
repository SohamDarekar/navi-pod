import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ColorScheme } from "utils/colorScheme";
import { DeviceThemeName } from "utils/themes";
import { isAuthenticated } from "utils/navidrome/client";

export const VOLUME_KEY = "ipodVolume";
export const COLOR_SCHEME_KEY = "ipodColorScheme";
export const DEVICE_COLOR_KEY = "ipodSelectedDeviceTheme";

export interface SettingsState {
  isNavidromeAuthorized: boolean;
  colorScheme: ColorScheme;
  deviceTheme: DeviceThemeName;
}

type SettingsContextType = [
  SettingsState,
  React.Dispatch<React.SetStateAction<SettingsState>>
];

export const SettingsContext = createContext<SettingsContextType>([
  {} as any,
  () => {},
]);

export type SettingsHook = SettingsState & {
  isAuthorized: boolean;
  setIsNavidromeAuthorized: (val: boolean) => void;
  setColorScheme: (colorScheme?: ColorScheme) => void;
  setDeviceTheme: (deviceTheme: DeviceThemeName) => void;
};

export const useSettings = (): SettingsHook => {
  const [state, setState] = useContext(SettingsContext);

  const setIsNavidromeAuthorized = useCallback(
    (val: boolean) =>
      setState((prevState) => ({
        ...prevState,
        isNavidromeAuthorized: val,
      })),
    [setState]
  );

  const setDeviceTheme = useCallback(
    (deviceTheme: DeviceThemeName) => {
      setState((prevState) => ({ ...prevState, deviceTheme }));
      localStorage.setItem(DEVICE_COLOR_KEY, deviceTheme);
    },
    [setState]
  );

  const setColorScheme = useCallback(
    (colorScheme?: ColorScheme) => {
      setState((prevState) => {
        const updatedColorScheme =
          colorScheme ?? prevState.colorScheme === "dark" ? "default" : "dark";

        localStorage.setItem(COLOR_SCHEME_KEY, `${updatedColorScheme}`);

        return {
          ...prevState,
          colorScheme: updatedColorScheme,
        };
      });
    },
    [setState]
  );

  return {
    ...state,
    isAuthorized: state.isNavidromeAuthorized,
    setIsNavidromeAuthorized,
    setColorScheme,
    setDeviceTheme,
  };
};

interface Props {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: Props) => {
  const [settingsState, setSettingsState] = useState<SettingsState>({
    isNavidromeAuthorized: false,
    colorScheme: "default",
    deviceTheme: "silver",
  });

  const handleMount = useCallback(() => {
    setSettingsState((prevState) => ({
      ...prevState,
      isNavidromeAuthorized: isAuthenticated(),
      colorScheme:
        (localStorage.getItem(COLOR_SCHEME_KEY) as ColorScheme) ?? "default",
      deviceTheme:
        (localStorage.getItem(DEVICE_COLOR_KEY) as DeviceThemeName) ?? "silver",
    }));
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setSettingsState((prevState) => ({
        ...prevState,
        isNavidromeAuthorized: isAuthenticated(),
      }));
    };

    window.addEventListener("navidrome-authenticated", handleAuthChange);
    window.addEventListener("navidrome-signed-out", handleAuthChange);

    return () => {
      window.removeEventListener("navidrome-authenticated", handleAuthChange);
      window.removeEventListener("navidrome-signed-out", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    handleMount();
  }, [handleMount]);

  return (
    <SettingsContext.Provider value={[settingsState, setSettingsState]}>
      {children}
    </SettingsContext.Provider>
  );
};

export default useSettings;
