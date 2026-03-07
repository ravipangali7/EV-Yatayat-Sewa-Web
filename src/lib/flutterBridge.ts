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

export type WalkieTalkieStatus = 'connected' | 'disconnected' | 'error';

export interface WalkieTalkieStatusPayload {
  status: WalkieTalkieStatus;
  message?: string;
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
      playBeepSound: () => void;
      refreshVehicle: () => void;
      startVoiceSearch: () => void;
      onTripStarted: () => void;
      onTripEnded: () => void;
      onReachedStop: (placeName: string, pickupDetails?: string) => void;
      connectWalkieTalkie: (serverUrl: string, token: string, groupIds: string[]) => void;
      disconnectWalkieTalkie: () => void;
      joinGroups: (groupIds: string[]) => void;
      pttStart: (groupId: string) => void;
      pttEnd: (groupId: string) => void;
    };
    __onScanResult?: (jsonStr: string) => void;
    __onLocationResult?: (jsonStr: string) => void;
    /** Called by Flutter every 1s with { lat, lng, speed? } when trip location stream is active (driver map). */
    __onDriverPosition?: (jsonStr: string) => void;
    __onVoiceSearchResult?: (jsonStr: string) => void;
    __onWalkieTalkieStatus?: (jsonStr: string) => void;
    __onPTTStarted?: (jsonStr: string) => void;
    __onPTTEnded?: (jsonStr: string) => void;
    __onPTTAudio?: (jsonStr: string) => void;
  }
}

export interface VoiceSearchResult {
  transcript: string;
  error?: string;
}

/** Start voice search via Flutter native (when in WebView). Returns a promise that resolves with transcript or rejects with error. */
export function startVoiceSearchNative(): Promise<VoiceSearchResult> {
  if (!isAvailable() || !window.FlutterBridge?.startVoiceSearch) {
    return Promise.reject(new Error('Voice search not available'));
  }
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      if (window.__onVoiceSearchResult) {
        window.__onVoiceSearchResult = undefined;
        reject(new Error('Voice search timed out'));
      }
    }, 15000);
    window.__onVoiceSearchResult = (jsonStr: string) => {
      window.clearTimeout(timeout);
      window.__onVoiceSearchResult = undefined;
      try {
        const data = JSON.parse(jsonStr) as VoiceSearchResult;
        if (data.error) reject(new Error(data.error));
        else resolve(data);
      } catch {
        reject(new Error('Invalid response'));
      }
    };
    window.FlutterBridge.startVoiceSearch();
  });
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

/** Play beep sound when checkout/dropoff popup opens. Uses Flutter asset in WebView, else /sounds/beep.mp3 on web. */
export function playBeep(): void {
  if (isAvailable() && typeof window.FlutterBridge?.playBeepSound === 'function') {
    window.FlutterBridge.playBeepSound();
    return;
  }
  try {
    const audio = new Audio('/sounds/beep.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch {
    // fallback: synthetic beep
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }
}

/** Ask Flutter to refresh vehicle/seat data (e.g. after checkout). No-op when not in WebView. */
export function refreshVehicle(): void {
  if (isAvailable() && typeof window.FlutterBridge?.refreshVehicle === 'function') {
    window.FlutterBridge.refreshVehicle();
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

export function connectWalkieTalkie(serverUrl: string, token: string, groupIds: string[]): void {
  if (isAvailable() && window.FlutterBridge?.connectWalkieTalkie) {
    window.FlutterBridge.connectWalkieTalkie(serverUrl, token, groupIds);
  }
}

export function disconnectWalkieTalkie(): void {
  if (isAvailable() && window.FlutterBridge?.disconnectWalkieTalkie) {
    window.FlutterBridge.disconnectWalkieTalkie();
  }
}

export function joinGroupsWalkieTalkie(groupIds: string[]): void {
  if (isAvailable() && window.FlutterBridge?.joinGroups) {
    window.FlutterBridge.joinGroups(groupIds);
  }
}

export function pttStart(groupId: string): void {
  if (isAvailable() && window.FlutterBridge?.pttStart) {
    window.FlutterBridge.pttStart(groupId);
  }
}

export function pttEnd(groupId: string): void {
  if (isAvailable() && window.FlutterBridge?.pttEnd) {
    window.FlutterBridge.pttEnd(groupId);
  }
}
