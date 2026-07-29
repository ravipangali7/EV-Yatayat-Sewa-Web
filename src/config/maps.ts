export const GOOGLE_MAPS_API_KEY = 'AIzaSyAGIdrqHts3zPr59SwAfDaXy4yty02bVfM';

/** Optional Map ID for vector map (required for setHeading/rotation). Create in Google Cloud Console → Map Management. Set VITE_GOOGLE_MAPS_MAP_ID in .env to enable. */
export const GOOGLE_MAPS_MAP_ID =
  (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_MAP_ID) ||
  undefined;

export const GOOGLE_MAPS_CONFIG = {
  id: 'google-maps-app',
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry'] as const,
  mapId: GOOGLE_MAPS_MAP_ID,
};
