// Where the backend lives. Empty means "this same site": in development Vite
// passes /api and /uploads on to the backend (vite.config.js), and on the server
// the backend serves the app itself. Set VITE_API_URL only for a backend on another address.
export const API_URL = import.meta.env.VITE_API_URL || "";

// Photos are saved as "/uploads/x.webp", so the server address goes in front.
// Older full addresses and local previews (blob:) are used as they are.
export function fileUrl(path) {
  return path?.startsWith("/") ? API_URL + path : path;
}
