import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Radio, Loader2 } from "lucide-react";
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
  return window.location.origin;
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

  const inApp = isFlutterBridgeAvailable();

  if (!inApp) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Walkie-Talkie is available only in the mobile app (WebView).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-primary pt-6 pb-8 px-5 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-primary-foreground">Walkie-Talkie</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Push to talk in a group</p>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl shadow p-4">
              <label className="text-sm font-medium text-foreground block mb-2">Group</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={status === "connected"}
              >
                <option value="">Select group</option>
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name} ({g.member_count} members)
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card rounded-xl shadow p-4 flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <span
                className={`text-sm font-medium ${
                  status === "connected"
                    ? "text-green-600"
                    : status === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {status === "connected" ? "Connected" : status === "error" ? statusMessage || "Error" : "Disconnected"}
              </span>
            </div>

            <div className="flex gap-3">
              {status !== "connected" ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={groups.length === 0 || !token}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  Connect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex-1 py-3 rounded-xl border border-input bg-background font-medium"
                >
                  Disconnect
                </button>
              )}
            </div>

            {status === "connected" && (
              <div className="bg-card rounded-xl shadow p-6 flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Hold the button to talk in <strong>{groups.find((g) => String(g.id) === selectedGroupId)?.name ?? selectedGroupId}</strong>
                </p>
                <button
                  type="button"
                  className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center touch-manipulation select-none"
                  onMouseDown={handlePttDown}
                  onMouseUp={handlePttUp}
                  onMouseLeave={handlePttUp}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handlePttDown();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handlePttUp();
                  }}
                >
                  <Mic className={`w-10 h-10 ${pttActive ? "scale-110" : ""}`} />
                </button>
                <span className="text-xs text-muted-foreground mt-2">
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
