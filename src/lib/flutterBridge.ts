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
