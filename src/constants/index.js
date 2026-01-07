// For production (Vercel), we must use the absolute URL from env var.
// For development (local), we can use the relative path (via Vite proxy) or localhost.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";