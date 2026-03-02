import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Radio, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { walkietalkieApi, type WalkieTalkieGroup } from "@/modules/walkietalkie/services/walkietalkieApi";
import {
  isAvailable as isFlutterBridgeAvailable,
  connectWalkieTalkie,
  disconnectWalkieTalkie,
  pttStart,
  pttEnd,
  type WalkieTalkieStatusPayload,
} from "@/lib/flutterBridge";

function getPttServerUrl(): string {
  if (typeof import.meta.env.VITE_PTT_SERVER_URL === "string" && import.meta.env.VITE_PTT_SERVER_URL) {
    return import.meta.env.VITE_PTT_SERVER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return `https://node.evyatayatsewa.com`;
}

export default function WalkieTalkie() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<WalkieTalkieGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<WalkieTalkieStatusPayload["status"]>("disconnected");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [pttActive, setPttActive] = useState(false);
  const statusCallbackRef = useRef<((jsonStr: string) => void) | null>(null);
  const pttButtonRef = useRef<HTMLButtonElement>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const list = await walkietalkieApi.listGroups();
      setGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(String(list[0].id));
      }
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr) as WalkieTalkieStatusPayload;
        setStatus(data.status);
        setStatusMessage(data.message ?? null);
      } catch {
        setStatus("error");
        setStatusMessage("Invalid status");
      }
    };
    window.__onWalkieTalkieStatus = handler;
    statusCallbackRef.current = handler;
    return () => {
      if (window.__onWalkieTalkieStatus === statusCallbackRef.current) {
        window.__onWalkieTalkieStatus = undefined;
      }
    };
  }, []);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const pttServerUrl = getPttServerUrl();

  const handleConnect = () => {
    if (!token || groups.length === 0) return;
    const groupIds = groups.map((g) => String(g.id));
    connectWalkieTalkie(pttServerUrl, token, groupIds);
    setStatus("disconnected");
    setStatusMessage("Connecting…");
  };

  const handleDisconnect = () => {
    disconnectWalkieTalkie();
    setStatus("disconnected");
    setStatusMessage(null);
  };

  const handlePttDown = () => {
    if (selectedGroupId && status === "connected") {
      pttStart(selectedGroupId);
      setPttActive(true);
    }
  };

  const handlePttUp = () => {
    if (selectedGroupId) {
      pttEnd(selectedGroupId);
      setPttActive(false);
    }
  };

  const handlePttDownRef = useRef(handlePttDown);
  const handlePttUpRef = useRef(handlePttUp);
  handlePttDownRef.current = handlePttDown;
  handlePttUpRef.current = handlePttUp;

  useEffect(() => {
    const el = pttButtonRef.current;
    if (!el) return;
    const opts: AddEventListenerOptions = { passive: false };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handlePttDownRef.current();
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handlePttUpRef.current();
    };
    const onTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      handlePttUpRef.current();
    };
    el.addEventListener("touchstart", onTouchStart, opts);
    el.addEventListener("touchend", onTouchEnd, opts);
    el.addEventListener("touchcancel", onTouchCancel, opts);
    return () => {
      el.removeEventListener("touchstart", onTouchStart, opts);
      el.removeEventListener("touchend", onTouchEnd, opts);
      el.removeEventListener("touchcancel", onTouchCancel, opts);
    };
  }, [status]);

  const inApp = isFlutterBridgeAvailable();
  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);
  const isConnected = status === "connected";
  const StatusIcon = isConnected ? Wifi : status === "error" ? AlertCircle : WifiOff;

  if (!inApp) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Radio className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Walkie-Talkie</h2>
          <p className="text-sm text-muted-foreground">
            Push-to-talk is available only inside the EV Yatayat Sewa mobile app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground pt-safe-top pt-6 pb-8 px-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Walkie-Talkie</h1>
              <p className="text-primary-foreground/80 text-xs">Push to talk</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isConnected
                ? "bg-emerald-500/20 text-emerald-100"
                : status === "error"
                  ? "bg-red-500/20 text-red-100"
                  : "bg-white/20 text-primary-foreground/80"
            }`}
          >
            <StatusIcon className="h-3 w-3" />
            {isConnected ? "Live" : status === "error" ? "Error" : "Offline"}
          </span>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 shadow-sm p-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Channel</label>
              <select
                className="w-full rounded-xl border border-input bg-background px-4 h-11 text-sm font-medium focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={isConnected}
              >
                <option value="">Select channel</option>
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name} · {g.member_count} members
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={groups.length === 0 || !token}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Wifi className="h-4 w-4" />
                  Connect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex-1 h-12 rounded-xl border border-border bg-white dark:bg-card font-semibold hover:bg-muted flex items-center justify-center gap-2 text-sm"
                >
                  <WifiOff className="h-4 w-4" />
                  Disconnect
                </button>
              )}
            </div>

            {isConnected && (
              <div className="bg-white dark:bg-card/80 rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-5 text-center">
                  Talking in <strong className="text-foreground">{selectedGroup?.name ?? "channel"}</strong>
                </p>
                <button
                  ref={pttButtonRef}
                  type="button"
                  className={`h-24 w-24 rounded-full flex items-center justify-center touch-manipulation select-none shadow-lg active:scale-95 transition-all outline-none ${pttActive ? "bg-rose-500 shadow-rose-500/30 scale-105" : "bg-primary shadow-primary/25"} text-primary-foreground`}
                  style={{ touchAction: "none" }}
                  onMouseDown={handlePttDown}
                  onMouseUp={handlePttUp}
                  onMouseLeave={handlePttUp}
                >
                  <Mic className={`h-9 w-9 ${pttActive ? "scale-110" : ""} transition-transform`} />
                </button>
                <span className="text-sm font-semibold mt-4 text-foreground">
                  {pttActive ? "Speaking…" : "Hold to talk"}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
