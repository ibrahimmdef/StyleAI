// Where the backend lives. On a deployed site set VITE_API_URL,
// on your own machine it falls back to the local server.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Photos are saved as "/uploads/x.webp", so the server address goes in front.
// Older full addresses and local previews (blob:) are used as they are.
export function fileUrl(path) {
  return path?.startsWith("/") ? API_URL + path : path;
}
