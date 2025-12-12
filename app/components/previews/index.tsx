import GamesPreview from "./GamesPreview";
import MusicPreview from "./MusicPreview";
import NowPlayingPreview from "./NowPlayingPreview";
import ServicePreview from "./ServicePreview";
import SettingsPreview from "./SettingsPreview";
import SyncStatusPreview from "./SyncStatusPreview";
import ThemePreview from "./ThemePreview";
import PlaybackSettingsPreview from "./PlaybackSettingsPreview";

export enum SplitScreenPreview {
  Music = "music",
  Games = "games",
  Settings = "settings",
  NowPlaying = "nowPlaying",
  Service = "service",
  Theme = "theme",
  SyncStatus = "syncStatus",
  PlaybackSettings = "playbackSettings",
}

export const Previews = {
  [SplitScreenPreview.Music]: () => <MusicPreview />,
  [SplitScreenPreview.Games]: () => <GamesPreview />,
  [SplitScreenPreview.Settings]: () => <SettingsPreview />,
  [SplitScreenPreview.NowPlaying]: () => <NowPlayingPreview />,
  [SplitScreenPreview.Service]: () => <ServicePreview />,
  [SplitScreenPreview.Theme]: () => <ThemePreview />,
  [SplitScreenPreview.SyncStatus]: () => <SyncStatusPreview />,
  [SplitScreenPreview.PlaybackSettings]: () => <PlaybackSettingsPreview />,
};

export { SyncStatusPreview };
