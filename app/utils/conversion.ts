/**
 * NaviPod - Conversion Utilities
 * Helper functions for data transformation
 */

// Artwork URL helper
/** Accepts a url with '{w}' and '{h}' and replaces them with the specified size */
export const getAppleArtwork = (size: number | string, url?: string) => {
  if (!url) {
    return undefined;
  }

  return url.replace("{w}", `${size || 100}`).replace("{h}", `${size || 100}`);
};

// Note: All Spotify and Apple Music conversion functions have been removed
// Use the conversion functions in utils/navidrome/types.ts instead
