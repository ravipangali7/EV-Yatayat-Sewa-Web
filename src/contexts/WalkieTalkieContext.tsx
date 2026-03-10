import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useDriverActiveTrip } from "@/hooks/useDriverActiveTrip";
import {
  isAvailable as isFlutterBridgeAvailable,
  connectWalkieTalkie,
  disconnectWalkieTalkie,
  pttStart as bridgePttStart,
  pttEnd as bridgePttEnd,
} from "@/lib/flutterBridge";
import { playPcmBase64Chunk, resetPttPlaybackSchedule, playPttStartSound, playPttEndSound } from "@/lib/pttPlayback";
import * as recordingPlayer from "@/lib/recordingPlayer";
import { toast } from "sonner";
import { createPttAudioContext, startPttCapture, type PttCaptureHandle } from "@/lib/pttCapture";
import {
  walkietalkieApi,
  type WalkieTalkieGroup,
  type WalkieTalkieRecording,
  type WalkieTalkieAdmin,
} from "@/modules/walkietalkie/services/walkietalkieApi";

export type WalkieTalkieStatus = "connected" | "disconnected" | "error";

function getPttServerUrl(): string {
  if (typeof import.meta.env.VITE_PTT_SERVER_URL === "string" && import.meta.env.VITE_PTT_SERVER_URL) {
    return import.meta.env.VITE_PTT_SERVER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return typeof window !== "undefined" ? `https://node.evyatayatsewa.com` : "";
}

interface WalkieTalkieContextType {
  status: WalkieTalkieStatus;
  statusMessage: string | null;
  groups: WalkieTalkieGroup[];
  admins: WalkieTalkieAdmin[];
  recordings: WalkieTalkieRecording[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  pttActive: boolean;
  speakingUser: { userId: number; name?: string; groupId: string } | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  connect: () => void;
  disconnect: () => void;
  pttStart: (groupId: string) => void;
  pttEnd: (groupId: string) => void;
  fetchRecordings: (params?: { group_id?: number }) => Promise<void>;
  playRecording: (id: number) => Promise<void>;
  pausePlayback: () => void;
  activeRecordingId: number | null;
  playbackCurrentTime: number;
  playbackDuration: number;
  isPlaybackPlaying: boolean;
  joinDirectRoom: (driverId: number) => void;
  isWebView: boolean;
  retryConnect: () => void;
  playDirectMessage: (id: number, sampleRate?: number) => Promise<void>;
  activeDirectMessageId: number | null;
}

const WalkieTalkieContext = createContext<WalkieTalkieContextType | undefined>(undefined);

export function WalkieTalkieProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { hasActiveTrip } = useDriverActiveTrip();
  const [status, setStatus] = useState<WalkieTalkieStatus>("disconnected");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [groups, setGroups] = useState<WalkieTalkieGroup[]>([]);
  const [admins, setAdmins] = useState<WalkieTalkieAdmin[]>([]);
  const [recordings, setRecordings] = useState<WalkieTalkieRecording[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [pttActive, setPttActive] = useState(false);
  const [speakingUser, setSpeakingUser] = useState<{ userId: number; name?: string; groupId: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<number | null>(null);
  const [activeDirectMessageId, setActiveDirectMessageId] = useState<number | null>(null);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const hasAutoConnected = useRef(false);
  const captureHandleRef = useRef<PttCaptureHandle | null>(null);
  const lastPausedOffsetRef = useRef(0);
  const selectedGroupIdRef = useRef(selectedGroupId);
  const fetchRecordingsRef = useRef<(params?: { group_id?: number }) => Promise<void>>(() => Promise.resolve());
  const [connectRetryKey, setConnectRetryKey] = useState(0);
  const [flutterBridgeReady, setFlutterBridgeReady] = useState(false);

  const isWebView = isFlutterBridgeAvailable();
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const serverUrl = getPttServerUrl();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const fetchRecordings = useCallback(async (params?: { group_id?: number }) => {
    try {
      const list = await walkietalkieApi.listRecordings(params);
      setRecordings(list);
    } catch {
      setRecordings([]);
    }
  }, []);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
  }, [selectedGroupId]);
  useEffect(() => {
    fetchRecordingsRef.current = fetchRecordings;
  }, [fetchRecordings]);

  const playDirectMessage = useCallback(async (id: number, sampleRate = 48000) => {
    try {
      const isResume = activeDirectMessageId === id && !isPlaybackPlaying;
      if (!isResume) {
        recordingPlayer.stop();
        setActiveRecordingId(null);
        if (activeDirectMessageId !== null) setActiveDirectMessageId(null);
        const blob = await walkietalkieApi.getDirectMessagePlayBlob(id);
        await recordingPlayer.loadFromBlob(blob, sampleRate);
        setPlaybackDuration(recordingPlayer.getDuration());
        setPlaybackCurrentTime(0);
        lastPausedOffsetRef.current = 0;
      }
      setActiveDirectMessageId(id);
      setIsPlaybackPlaying(true);
      const startOffset = isResume ? lastPausedOffsetRef.current : 0;
      recordingPlayer.play(
        startOffset,
        (current, duration) => {
          setPlaybackCurrentTime(current);
          setPlaybackDuration(duration);
        },
        () => {
          setIsPlaybackPlaying(false);
          setPlaybackCurrentTime(recordingPlayer.getDuration());
          setActiveDirectMessageId(null);
        }
      );
    } catch {
      toast.error("Playback failed");
      setIsPlaybackPlaying(false);
      setActiveDirectMessageId(null);
    }
  }, [activeDirectMessageId, isPlaybackPlaying]);

  const playRecording = useCallback(async (id: number) => {
    try {
      const isResume = activeRecordingId === id && !isPlaybackPlaying;
      if (!isResume) {
        recordingPlayer.stop();
        setActiveDirectMessageId(null);
        if (activeRecordingId !== null) setActiveRecordingId(null);
        const blob = await walkietalkieApi.getRecordingPlayBlob(id);
        const rec = recordings.find((r) => r.id === id);
        const sampleRate = rec?.sample_rate != null && rec.sample_rate > 0 ? rec.sample_rate : 48000;
        await recordingPlayer.loadFromBlob(blob, sampleRate);
        setPlaybackDuration(recordingPlayer.getDuration());
        setPlaybackCurrentTime(0);
        lastPausedOffsetRef.current = 0;
      }
      setActiveRecordingId(id);
      setIsPlaybackPlaying(true);
      const startOffset = isResume ? lastPausedOffsetRef.current : 0;
      recordingPlayer.play(
        startOffset,
        (current, duration) => {
          setPlaybackCurrentTime(current);
          setPlaybackDuration(duration);
        },
        () => {
          setIsPlaybackPlaying(false);
          setPlaybackCurrentTime(recordingPlayer.getDuration());
        }
      );
    } catch {
      toast.error("Playback failed");
      setIsPlaybackPlaying(false);
    }
  }, [activeRecordingId, isPlaybackPlaying, recordings]);

  const pausePlayback = useCallback(() => {
    const offset = recordingPlayer.pause();
    lastPausedOffsetRef.current = offset;
    setPlaybackCurrentTime(offset);
    setIsPlaybackPlaying(false);
  }, []);

  const joinDirectRoom = useCallback(
    (driverId: number) => {
      const directId = `direct:${driverId}`;
      const baseIds = groups.map((g) => String(g.id));
      const withDirect = [...baseIds, directId];
      if (user?.is_driver) {
        withDirect.push(`direct:${user.id}`);
        admins.forEach((a) => withDirect.push(`direct:${a.id}`));
      }
      if (user?.is_staff || user?.is_superuser) {
        if (!withDirect.includes(`direct:${user.id}`)) withDirect.push(`direct:${user.id}`);
      }
      const uniqueIds = Array.from(new Set(withDirect));
      if (isWebView) {
        connectWalkieTalkie(serverUrl, token ?? "", uniqueIds);
        return;
      }
      socketRef.current?.emit("join_groups", { groupIds: uniqueIds });
    },
    [groups, admins, user?.id, user?.is_driver, user?.is_staff, user?.is_superuser, isWebView, serverUrl, token]
  );

  const connect = useCallback(() => {
    if (!token || groups.length === 0) return;
    const baseIds = groups.map((g) => String(g.id));
    const fullGroupIds = [...baseIds];
    if (user?.is_driver) {
      fullGroupIds.push(`direct:${user.id}`);
      admins.forEach((a) => fullGroupIds.push(`direct:${a.id}`));
    }
    if (user?.is_staff || user?.is_superuser) {
      if (!fullGroupIds.includes(`direct:${user.id}`)) fullGroupIds.push(`direct:${user.id}`);
    }
    const groupIds = Array.from(new Set(fullGroupIds));

    if (isWebView) {
      connectWalkieTalkie(serverUrl, token, groupIds);
      setStatus("disconnected");
      setStatusMessage("Connecting…");
      return;
    }

    if (socketRef.current?.connected) return;
    socketRef.current?.disconnect();
    const socket = io(serverUrl, { path: "/socket.io/", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("auth", { token }, (ack: unknown) => {
        if (ack && typeof ack === "object" && (ack as { success?: boolean }).success) {
          socket.emit("join_groups", { groupIds });
        } else {
          setStatus("error");
          setStatusMessage("Authentication failed");
          socket.disconnect();
        }
      });
    });

    socket.on("joined_groups", () => setStatus("connected"));
    socket.on("error", (data: { message?: string }) => {
      setStatus("error");
      setStatusMessage(data?.message ?? "Error");
    });
    socket.on("ptt_started", (data: { userId?: number; name?: string; groupId?: string }) => {
      resetPttPlaybackSchedule();
      setSpeakingUser({
        userId: data.userId ?? 0,
        name: data.name,
        groupId: data.groupId ?? "",
      });
    });
    socket.on("ptt_audio", (data: { chunk?: string; sampleRate?: number; sample_rate?: number }) => {
      if (typeof data.chunk === "string") {
        const sr = data.sampleRate ?? data.sample_rate;
        playPcmBase64Chunk(data.chunk, sr);
      }
    });
    socket.on("ptt_ended", () => {
      setSpeakingUser(null);
      setTimeout(() => {
        const groupId = selectedGroupIdRef.current;
        if (groupId && !groupId.startsWith("direct")) {
          const id = Number(groupId);
          if (!Number.isNaN(id)) fetchRecordingsRef.current?.({ group_id: id });
        }
      }, 1500);
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => {
      setStatus("error");
      setStatusMessage("Connection failed");
    });
  }, [token, groups, admins, user?.id, user?.is_driver, user?.is_staff, user?.is_superuser, serverUrl, isWebView]);

  const disconnect = useCallback(() => {
    if (isWebView) {
      disconnectWalkieTalkie();
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
      socketRef.current = null;
    }
    setStatus("disconnected");
    setStatusMessage(null);
    setSpeakingUser(null);
  }, [isWebView]);

  const pttStart = useCallback(
    (groupId: string) => {
      if (isWebView) {
        bridgePttStart(groupId);
        setPttActive(true);
        return;
      }
      if (!socketRef.current?.connected) return;
      setPttActive(true);
      socketRef.current.emit("ptt_start", { groupId });
      const audioContext = createPttAudioContext();
      startPttCapture(
        (base64, sampleRate) => {
          socketRef.current?.emit("ptt_audio", { chunk: base64, sampleRate });
        },
        audioContext
      )
        .then((handle) => {
          captureHandleRef.current = handle;
        })
        .catch((err) => {
          console.error("PTT mic error:", err);
          setPttActive(false);
          setStatusMessage("Microphone access denied or failed");
        });
    },
    [isWebView]
  );

  const pttEnd = useCallback(
    (groupId: string) => {
      if (isWebView) {
        bridgePttEnd(groupId);
        setPttActive(false);
        return;
      }
      if (captureHandleRef.current) {
        captureHandleRef.current.stop();
        captureHandleRef.current = null;
      }
      if (socketRef.current?.connected) socketRef.current.emit("ptt_end", { groupId });
      setPttActive(false);
      if (groupId && !groupId.startsWith("direct")) {
        const id = Number(groupId);
        if (!Number.isNaN(id)) setTimeout(() => fetchRecordings({ group_id: id }), 1500);
      }
    },
    [isWebView, fetchRecordings]
  );

  // Re-run connect after Flutter injects bridge (e.g. after WebView refresh)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFlutterAuthReady = () => setFlutterBridgeReady(true);
    window.addEventListener("flutterAuthReady", onFlutterAuthReady);
    return () => window.removeEventListener("flutterAuthReady", onFlutterAuthReady);
  }, []);

  // Let Flutter explicitly trigger reconnect after inject (in case event was missed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__reconnectWalkieTalkie = () => setFlutterBridgeReady(true);
    return () => {
      delete window.__reconnectWalkieTalkie;
    };
  }, []);

  // Fallback: if bridge appears after mount (event missed), set ready so connect effect re-runs
  useEffect(() => {
    if (typeof window === "undefined" || isFlutterBridgeAvailable()) return;
    const intervalMs = 200;
    const maxTries = 15;
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (isFlutterBridgeAvailable()) {
        setFlutterBridgeReady(true);
        window.clearInterval(id);
        return;
      }
      if (tries >= maxTries) window.clearInterval(id);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setStatus("disconnected");
    setStatusMessage("Connecting…");
    (async () => {
      try {
        const raw = await walkietalkieApi.listGroups();
        const list = Array.isArray(raw) ? raw : [];
        if (cancelled) return;
        setGroups(list);
        if (list.length === 0) setStatusMessage(null);
        if (list.length > 0 && !selectedGroupId) setSelectedGroupId(String(list[0].id));
        let adminsList: WalkieTalkieAdmin[] = [];
        if (user?.is_driver) {
          try {
            adminsList = await walkietalkieApi.listAdmins();
            if (cancelled) return;
            setAdmins(adminsList);
          } catch {
            setAdmins([]);
          }
        } else {
          setAdmins([]);
        }
        const baseGroupIds = list.map((g) => String(g.id));
        const fullGroupIds = [...baseGroupIds];
        if (user?.is_driver) {
          fullGroupIds.push(`direct:${user.id}`);
          adminsList.forEach((a) => fullGroupIds.push(`direct:${a.id}`));
        }
        if (user?.is_staff || user?.is_superuser) {
          if (!fullGroupIds.includes(`direct:${user.id}`)) {
            fullGroupIds.push(`direct:${user.id}`);
          }
        }
        const driverMayConnect = !user?.is_driver || hasActiveTrip;
        if (driverMayConnect && isWebView) {
          if (fullGroupIds.length > 0) {
            hasAutoConnected.current = true;
            connectWalkieTalkie(serverUrl, token, fullGroupIds);
          }
        } else if (driverMayConnect && !isWebView) {
          // Bridge may appear late (e.g. after refresh); re-check so we connect via Flutter if it appears
          if (fullGroupIds.length > 0) {
            window.setTimeout(() => {
              if (isFlutterBridgeAvailable()) setFlutterBridgeReady(true);
            }, 400);
          }
          const socket = io(serverUrl, { path: "/socket.io/", transports: ["websocket", "polling"] });
          socketRef.current = socket;
          socket.on("connect", () => {
            socket.emit("auth", { token }, (ack: unknown) => {
              if (ack && typeof ack === "object" && (ack as { success?: boolean }).success) {
                socket.emit("join_groups", { groupIds: fullGroupIds });
              } else {
                setStatus("error");
                setStatusMessage("Authentication failed");
                socket.disconnect();
              }
            });
          });
          socket.on("joined_groups", () => setStatus("connected"));
          socket.on("error", (data: { message?: string }) => {
            setStatus("error");
            setStatusMessage(data?.message ?? "Error");
          });
          socket.on("ptt_started", (data: { userId?: number; name?: string; groupId?: string }) => {
            playPttStartSound();
            resetPttPlaybackSchedule();
            setSpeakingUser({
              userId: data.userId ?? 0,
              name: data.name,
              groupId: data.groupId ?? "",
            });
          });
          socket.on("ptt_audio", (data: { chunk?: string; sampleRate?: number; sample_rate?: number }) => {
            if (typeof data.chunk === "string") {
              const sr = data.sampleRate ?? data.sample_rate;
              playPcmBase64Chunk(data.chunk, sr);
            }
          });
          socket.on("ptt_ended", () => {
            playPttEndSound();
            setSpeakingUser(null);
            setTimeout(() => {
              const groupId = selectedGroupIdRef.current;
              if (groupId && !groupId.startsWith("direct")) {
                const id = Number(groupId);
                if (!Number.isNaN(id)) fetchRecordingsRef.current?.({ group_id: id });
              }
            }, 1500);
          });
          socket.on("disconnect", () => setStatus("disconnected"));
          socket.on("connect_error", () => {
            setStatus("error");
            setStatusMessage("Connection failed");
          });
        }
      } catch {
        if (!cancelled) {
          setGroups([]);
          setStatus("error");
          setStatusMessage("Could not load groups. Check your connection.");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      hasAutoConnected.current = false;
    };
  }, [token, serverUrl, isWebView, flutterBridgeReady, connectRetryKey, hasActiveTrip, user?.id, user?.is_driver, user?.is_staff, user?.is_superuser]);

  // When driver loses active trip, disconnect so they stop receiving/sending PTT
  useEffect(() => {
    if (user?.is_driver && !hasActiveTrip && status === "connected") {
      if (isWebView) {
        disconnectWalkieTalkie();
      } else if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
      setStatus("disconnected");
      setStatusMessage(null);
      setSpeakingUser(null);
      hasAutoConnected.current = false;
    }
  }, [user?.is_driver, hasActiveTrip, status, isWebView]);

  // Refetch groups when drawer opens; sync to socket so PTT works after groups load
  useEffect(() => {
    if (!drawerOpen || !token) return;
    const buildFullGroupIds = (
      list: WalkieTalkieGroup[],
      adminsList: WalkieTalkieAdmin[],
      u: { id: string; is_driver?: boolean; is_staff?: boolean; is_superuser?: boolean } | null
    ) => {
      const base = list.map((g) => String(g.id));
      if (u?.is_driver) {
        base.push(`direct:${u.id}`);
        adminsList.forEach((a) => base.push(`direct:${a.id}`));
      }
      if (u?.is_staff || u?.is_superuser) {
        if (!base.includes(`direct:${u.id}`)) base.push(`direct:${u.id}`);
      }
      return Array.from(new Set(base));
    };
    Promise.all([
      walkietalkieApi.listGroups(),
      user?.is_driver ? walkietalkieApi.listAdmins() : Promise.resolve([] as WalkieTalkieAdmin[]),
    ])
      .then(([raw, adminsList]) => {
        const list = Array.isArray(raw) ? raw : [];
        setGroups(list);
        if (user?.is_driver) setAdmins(adminsList);
        if (list.length > 0 && !selectedGroupIdRef.current) setSelectedGroupId(String(list[0].id));
        const groupIds = buildFullGroupIds(list, adminsList, user);
        if (groupIds.length > 0 && socketRef.current?.connected) {
          socketRef.current.emit("join_groups", { groupIds });
        }
      })
      .catch(() => {
        setStatus("error");
        setStatusMessage("Could not load groups. Check your connection.");
      });
  }, [drawerOpen, token, user?.id, user?.is_driver, user?.is_staff, user?.is_superuser]);

  // Register callbacks even when isWebView is false so Flutter's status push after inject is received
  useEffect(() => {
    const onStatus = (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr) as { status: WalkieTalkieStatus; message?: string };
        setStatus(data.status);
        setStatusMessage(data.message ?? null);
      } catch {
        setStatus("error");
      }
    };
    const onPTTStarted = (jsonStr: string) => {
      try {
        resetPttPlaybackSchedule();
        const data = JSON.parse(jsonStr) as { userId?: number; name?: string; groupId?: string };
        setSpeakingUser({
          userId: data.userId ?? 0,
          name: data.name,
          groupId: data.groupId ?? "",
        });
      } catch {
        setSpeakingUser(null);
      }
    };
    const onPTTAudio = (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr) as
          | { chunk?: string; sampleRate?: number; sample_rate?: number }
          | { batch?: Array<{ chunk?: string; sampleRate?: number }> };
        if (Array.isArray(data.batch)) {
          for (const item of data.batch) {
            if (typeof item.chunk === "string") {
              playPcmBase64Chunk(item.chunk, item.sampleRate);
            }
          }
          return;
        }
        const single = data as { chunk?: string; sampleRate?: number; sample_rate?: number };
        if (typeof single.chunk === "string") {
          const sr = single.sampleRate ?? single.sample_rate;
          playPcmBase64Chunk(single.chunk, sr);
        }
      } catch {
        // ignore
      }
    };
    const onPTTEnded = () => {
      setSpeakingUser(null);
      setTimeout(() => {
        const groupId = selectedGroupIdRef.current;
        if (groupId && !groupId.startsWith("direct")) {
          const id = Number(groupId);
          if (!Number.isNaN(id)) fetchRecordingsRef.current?.({ group_id: id });
        }
      }, 1500);
    };
    window.__onWalkieTalkieStatus = onStatus;
    window.__onPTTStarted = onPTTStarted;
    window.__onPTTAudio = onPTTAudio;
    window.__onPTTEnded = onPTTEnded;
    return () => {
      if (window.__onWalkieTalkieStatus === onStatus) window.__onWalkieTalkieStatus = undefined;
      if (window.__onPTTStarted === onPTTStarted) window.__onPTTStarted = undefined;
      if (window.__onPTTAudio === onPTTAudio) window.__onPTTAudio = undefined;
      if (window.__onPTTEnded === onPTTEnded) window.__onPTTEnded = undefined;
    };
  }, [isWebView]);

  useEffect(() => {
    return () => {
      hasAutoConnected.current = false;
      recordingPlayer.stop();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
    };
  }, []);

  const value: WalkieTalkieContextType = {
    status,
    statusMessage,
    groups,
    admins,
    recordings,
    selectedGroupId,
    setSelectedGroupId,
    pttActive,
    speakingUser,
    drawerOpen,
    openDrawer,
    closeDrawer,
    connect,
    disconnect,
    pttStart,
    pttEnd,
    fetchRecordings,
    playRecording,
    pausePlayback,
    activeRecordingId,
    playbackCurrentTime,
    playbackDuration,
    isPlaybackPlaying,
    joinDirectRoom,
    isWebView,
    retryConnect: () => setConnectRetryKey((k) => k + 1),
    playDirectMessage,
    activeDirectMessageId,
  };

  return (
    <WalkieTalkieContext.Provider value={value}>
      {children}
    </WalkieTalkieContext.Provider>
  );
}

export function useWalkieTalkie(): WalkieTalkieContextType {
  const ctx = useContext(WalkieTalkieContext);
  if (ctx === undefined) throw new Error("useWalkieTalkie must be used within WalkieTalkieProvider");
  return ctx;
}
