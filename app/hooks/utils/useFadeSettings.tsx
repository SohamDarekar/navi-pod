import { createContext, useContext, useEffect, useState, useCallback } from "react";

export const FADE_IN_KEY = "ipodFadeIn";
export const FADE_OUT_KEY = "ipodFadeOut";

export type FadeDuration = 0 | 3 | 5 | 7 | 10;

export interface FadeSettingsState {
  fadeIn: FadeDuration;
  fadeOut: FadeDuration;
  setFadeIn: (duration: FadeDuration) => void;
  setFadeOut: (duration: FadeDuration) => void;
}

export const FadeSettingsContext = createContext<FadeSettingsState>({} as any);

export const useFadeSettings = (): FadeSettingsState => {
  const state = useContext(FadeSettingsContext);
  return { ...state };
};

interface Props {
  children: React.ReactNode;
}

export const FadeSettingsProvider = ({ children }: Props) => {
  const [fadeIn, setFadeInState] = useState<FadeDuration>(0);
  const [fadeOut, setFadeOutState] = useState<FadeDuration>(0);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFadeIn = localStorage.getItem(FADE_IN_KEY);
      const savedFadeOut = localStorage.getItem(FADE_OUT_KEY);
      
      if (savedFadeIn) {
        const duration = parseInt(savedFadeIn) as FadeDuration;
        if ([0, 3, 5, 7, 10].includes(duration)) {
          setFadeInState(duration);
        }
      }
      
      if (savedFadeOut) {
        const duration = parseInt(savedFadeOut) as FadeDuration;
        if ([0, 3, 5, 7, 10].includes(duration)) {
          setFadeOutState(duration);
        }
      }
    }
  }, []);

  const setFadeIn = useCallback((duration: FadeDuration) => {
    setFadeInState(duration);
    if (typeof window !== "undefined") {
      localStorage.setItem(FADE_IN_KEY, duration.toString());
    }
    window.dispatchEvent(new CustomEvent("fade-in-changed", { detail: duration }));
  }, []);

  const setFadeOut = useCallback((duration: FadeDuration) => {
    setFadeOutState(duration);
    if (typeof window !== "undefined") {
      localStorage.setItem(FADE_OUT_KEY, duration.toString());
    }
    window.dispatchEvent(new CustomEvent("fade-out-changed", { detail: duration }));
  }, []);

  return (
    <FadeSettingsContext.Provider value={{ fadeIn, fadeOut, setFadeIn, setFadeOut }}>
      {children}
    </FadeSettingsContext.Provider>
  );
};

export default useFadeSettings;
