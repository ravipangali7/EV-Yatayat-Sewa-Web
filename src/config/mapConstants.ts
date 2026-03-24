/**
 * Centralized map UI constants: marker icons, sizes, polyline, and map settings.
 * Adjust these in one place to change appearance across all map components.
 */

/** URL for map markers that represent a vehicle (bus). */
export const VEHICLE_MARKER_ICON = "/icon/bus_marker.png";

/**
 * Global vehicle (bus) marker size on Google Maps (px).
 * Single source: driver nav, live tracking, home map, trip view, mini maps, rotated icon helper.
 */
export const MARKER_WIDTH = 35;
export const MARKER_HEIGHT = 95;
/** Anchor for vehicle marker icon (center of image). */
export const MARKER_ANCHOR_X = MARKER_WIDTH / 2;
export const MARKER_ANCHOR_Y = MARKER_HEIGHT / 2;

export const MARKER_ICONS = {
  start: "/start_point.png",
  stop: "/stop_point.png",
  end: "/end_point.png",
  current: VEHICLE_MARKER_ICON,
} as const;

/** Size in px for route markers (start, stop, end) on the map. */
export const ROUTE_MARKER_SIZE = 24;
/** Anchor offset so the marker tip is at the position (half of ROUTE_MARKER_SIZE for center). */
export const ROUTE_MARKER_ANCHOR = 12;

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
