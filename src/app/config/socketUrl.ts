/**
 * Socket.IO server URL for signaling.
 * In the browser we always use the same host as the current page (port 8000)
 * so one build works globally: same app opened from any device connects to
 * that device's view of the host (e.g. http://192.168.1.100:3000 → ws://192.168.1.100:8000).
 * On the server (SSR) we use NEXT_PUBLIC_SOCKET_URL or localhost.
 */
export function getSocketUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_URL) ||
    "http://localhost:8000"
  );
}
