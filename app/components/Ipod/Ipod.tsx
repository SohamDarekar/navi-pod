"use client";
import { memo } from "react";
import {
  AudioPlayerProvider,
  SettingsContext,
  SettingsProvider,
} from "hooks";
import { ClickWheel, ViewManager } from "components";
import {
  ScreenContainer,
  ClickWheelContainer,
  Shell,
  Sticker,
  Sticker2,
  Sticker3,
} from "components/Ipod/Styled";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ViewContextProvider from "providers/ViewContextProvider";
import { SyncStatusProvider } from "providers/SyncStatusProvider";
import { GlobalStyles } from "components/Ipod/GlobalStyles";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Ipod = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <SettingsProvider>
        <SyncStatusProvider>
          <ViewContextProvider>
            <AudioPlayerProvider>
            <SettingsContext.Consumer>
              {([{ deviceTheme }]) => (
                <Shell $deviceTheme={deviceTheme}>
                  <Sticker $deviceTheme={deviceTheme} />
                  <Sticker2 $deviceTheme={deviceTheme} />
                  <Sticker3 $deviceTheme={deviceTheme} />
                  <ScreenContainer>
                    <ViewManager />
                  </ScreenContainer>
                  <ClickWheelContainer>
                    <ClickWheel />
                  </ClickWheelContainer>
                </Shell>
              )}
            </SettingsContext.Consumer>
          </AudioPlayerProvider>
        </ViewContextProvider>
        </SyncStatusProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default memo(Ipod);
