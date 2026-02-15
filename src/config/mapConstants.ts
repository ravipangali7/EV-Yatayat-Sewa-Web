/**
 * Centralized map UI constants: marker icons, sizes, polyline, and map settings.
 * Adjust these in one place to change appearance across all map components.
 */

export const MARKER_ICONS = {
  start: "/start_point.png",
  stop: "/stop_point.png",
  end: "/end_point.png",
  current: "/navigation.png",
} as const;

/** Size in px for route markers (start, stop, end) on the map. */
export const ROUTE_MARKER_SIZE = 24;
/** Anchor offset so the marker tip is at the position (half of ROUTE_MARKER_SIZE for center). */
export const ROUTE_MARKER_ANCHOR = 12;

/** Size in px for the fixed navigation (current location) overlay image. */
export const NAVIGATION_MARKER_SIZE = 40;

export const POLYLINE_STROKE_WEIGHT = 3;
export const POLYLINE_STROKE_OPACITY = 0.8;
export const POLYLINE_STROKE_COLOR = "#3b82f6";

/** Default zoom for driver navigation map. */
export const NAV_ZOOM = 16;
export const NEPAL_CENTER = { lat: 27.7172, lng: 85.324 };

/** Padding (px) when fitting bounds to route points. */
export const FIT_BOUNDS_PADDING = 120;
/** Cap zoom after fitBounds so the view is not too close. */
export const MAX_ZOOM_AFTER_FIT = 12;
