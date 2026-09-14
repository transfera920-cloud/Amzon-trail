/**
 * YouTube URL Parser & Embed Helper
 * Ensures smooth playback across Mobile Safari, Android Chrome, LINE App Webview, and Desktop Browsers.
 */

export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Direct 11-char video ID (e.g., e_WLvxR6-Ns)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Standard patterns (watch?v=, youtu.be/, embed/, shorts/, live/, v/)
  // Supports query parameters like ?si=..., &feature=..., ?t=...
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  return null;
}

/**
 * Generate standard YouTube embed URL with key playback parameters:
 * - playsinline=1: MANDATORY for mobile iOS/Android/LINE Webview inline playback
 * - rel=0: Prevent showing unrelated third-party videos on pause/end
 * - modestbranding=1: Cleaner player interface
 * - enablejsapi=1: Proper lifecycle messaging
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1`;
}

/**
 * Generate direct web/app watch URL for external fallback button
 */
export function getYouTubeWatchUrl(url?: string | null): string {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url?.trim() || 'https://www.youtube.com';
}

/**
 * High quality video thumbnail
 */
export function getYouTubeThumbnail(url?: string | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
