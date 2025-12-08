import { SelectableListOption } from "components/SelectableList";
import { DEFAULT_ARTWORK_URL } from "utils/constants/api";

/** Accepts a url with '{w}' and '{h}' and replaces them with the specified size */
export const getArtwork = (size: number | string, url?: string) => {
  if (!url) {
    return DEFAULT_ARTWORK_URL;
  }

  const urlWithSize = url.replace("{w}", `${size}`).replace("{h}", `${size}`);
  return urlWithSize;
};

export const setDocumentSongTitle = (songName?: string) => {
  document.title = songName
    ? `${songName} – NaviPod`
    : "NaviPod";
};

/** Returns a list of playback options to display in a popup for an album, song, or playlist. */
export const getMediaOptions = (
  type: "album" | "song" | "playlist",
  id: string
): SelectableListOption[] => {
  // TODO: Implement queue management for Navidrome
  // For now, return empty array since MusicKit is not available
  return [];
};

export const formatPlaybackTime = (seconds: number) => {
  const dateObject = new Date();
  dateObject.setMinutes(0);
  dateObject.setSeconds(seconds);
  const formattedMinutes = dateObject.getMinutes().toString().padStart(2, "0");
  const formattedSeconds = dateObject.getSeconds().toString().padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 *
 * [Client-side only] Returns the root URL of the app, depending on the environment
 */
export const getRootAppUrl = () => {
  const isDev = process.env.NODE_ENV === "development";

  const protocol = isDev ? "http" : "https";
  const rootUrl = isDev ? `localhost:3000` : process.env.VERCEL_BASE_URL;

  return `${protocol}://${rootUrl}`;
};
