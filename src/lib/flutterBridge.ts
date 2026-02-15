/**
 * Bridge to Flutter native (WebView) for scan, location, and auth sync.
 * Only available when the app runs inside the Flutter WebView.
 */

export interface ScanResult {
  success: boolean;
  vehicleId?: string;
  rawCode?: string;
  error?: string;
}

export interface LocationResult {
  success: boolean;
  lat?: number;
  lng?: number;
  speed?: number;
  accuracy?: number;
  error?: string;
}

declare global {
  interface Window {
    FlutterBridge?: {
      requestScan: () => void;
      requestLocation: () => void;
      authSync: (token: string, userStr: string) => void;
      startLocationStream: (tripId: string, vehicleId: string, intervalSeconds?: number, token?: string, userStr?: string) => void;
      stopLocationStream: () => void;
      playSound: (text: string) => void;
      playReachedStop: (placeName: string) => void;
      onTripStarted: () => void;
      onTripEnded: () => void;
      onReachedStop: (placeName: string, pickupDetails?: string) => void;
    };
    __onScanResult?: (jsonStr: string) => void;
    __onLocationResult?: (jsonStr: string) => void;
  }
}

export function isAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.FlutterBridge !== 'undefined';
}

export function requestScan(): Promise<ScanResult> {
  if (!isAvailable() || !window.FlutterBridge) {
    return Promise.resolve({ success: false, error: 'Bridge not available' });
  }
  return new Promise((resolve) => {
    window.__onScanResult = (jsonStr: string) => {
      try {
        resolve(JSON.parse(jsonStr) as ScanResult);
      } catch {
        resolve({ success: false, error: 'Invalid response' });
      }
      delete window.__onScanResult;
    };
    window.FlutterBridge.requestScan();
  });
}

export function requestLocation(): Promise<LocationResult> {
  if (!isAvailable() || !window.FlutterBridge) {
    return Promise.resolve({ success: false, error: 'Bridge not available' });
  }
  return new Promise((resolve) => {
    window.__onLocationResult = (jsonStr: string) => {
      try {
        resolve(JSON.parse(jsonStr) as LocationResult);
      } catch {
        resolve({ success: false, error: 'Invalid response' });
      }
      delete window.__onLocationResult;
    };
    window.FlutterBridge.requestLocation();
  });
}

export function authSync(token: string, userStr: string): void {
  if (isAvailable() && window.FlutterBridge) {
    window.FlutterBridge.authSync(token, userStr);
  }
}

export function startLocationStream(
  tripId: string,
  vehicleId: string,
  intervalSeconds?: number,
  token?: string,
  userStr?: string
): void {
  if (isAvailable() && window.FlutterBridge?.startLocationStream) {
    window.FlutterBridge.startLocationStream(tripId, vehicleId, intervalSeconds ?? 30, token, userStr);
  }
}

export function stopLocationStream(): void {
  if (isAvailable() && window.FlutterBridge?.stopLocationStream) {
    window.FlutterBridge.stopLocationStream();
  }
}

export function playSound(text: string): void {
  if (isAvailable() && window.FlutterBridge?.playSound) {
    window.FlutterBridge.playSound(text);
  }
}

export function playReachedStop(placeName: string): void {
  if (isAvailable() && window.FlutterBridge?.playReachedStop) {
    window.FlutterBridge.playReachedStop(placeName);
  }
}

export function onTripStarted(): void {
  if (isAvailable() && window.FlutterBridge?.onTripStarted) {
    window.FlutterBridge.onTripStarted();
  }
}

export function onTripEnded(): void {
  if (isAvailable() && window.FlutterBridge?.onTripEnded) {
    window.FlutterBridge.onTripEnded();
  }
}

export function onReachedStop(placeName: string, pickupDetails?: string): void {
  if (isAvailable() && window.FlutterBridge?.onReachedStop) {
    window.FlutterBridge.onReachedStop(placeName, pickupDetails);
  }
}
