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
import {
  isAvailable as isFlutterBridgeAvailable,
  connectWalkieTalkie,
  disconnectWalkieTalkie,
  pttStart as bridgePttStart,
  pttEnd as bridgePttEnd,
} from "@/lib/flutterBridge";
import { playPcmBase64Chunk } from "@/lib/pttPlayback";
import {
  walkietalkieApi,
  type WalkieTalkieGroup,
  type WalkieTalkieRecording,
} from "@/modules/walkietalkie/services/walkietalkieApi";

export type WalkieTalkieStatus = "connected" | "disconnected" | "error";

function getPttServerUrl(): string {
  if (typeof import.meta.env.VITE_PTT_SERVER_URL === "string" && import.meta.env.VITE_PTT_SERVER_URL) {
    return import.meta.env.VITE_PTT_SERVER_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return typeof window !== "undefined" ? window.location.origin : "";
}

interface WalkieTalkieContextType {
  status: WalkieTalkieStatus;
  statusMessage: string | null;
  groups: WalkieTalkieGroup[];
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
  fetchRecordings: () => Promise<void>;
  playRecording: (id: number) => Promise<void>;
  isWebView: boolean;
}

const WalkieTalkieContext = createContext<WalkieTalkieContextType | undefined>(undefined);

export function WalkieTalkieProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<WalkieTalkieStatus>("disconnected");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [groups, setGroups] = useState<WalkieTalkieGroup[]>([]);
  const [recordings, setRecordings] = useState<WalkieTalkieRecording[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [pttActive, setPttActive] = useState(false);
  const [speakingUser, setSpeakingUser] = useState<{ userId: number; name?: string; groupId: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const hasAutoConnected = useRef(false);

  const isWebView = isFlutterBridgeAvailable();
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const serverUrl = getPttServerUrl();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const fetchRecordings = useCallback(async () => {
    try {
      const list = await walkietalkieApi.listRecordings();
      setRecordings(list);
    } catch {
      setRecordings([]);
    }
  }, []);

  const playRecording = useCallback(async (id: number) => {
    try {
      const blob = await walkietalkieApi.getRecordingPlayBlob(id);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      // ignore
    }
  }, []);

  const connect = useCallback(() => {
    if (!token || groups.length === 0) return;
    const groupIds = groups.map((g) => String(g.id));

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
      setSpeakingUser({
        userId: data.userId ?? 0,
        name: data.name,
        groupId: data.groupId ?? "",
      });
    });
    socket.on("ptt_audio", (data: { chunk?: string }) => {
      if (typeof data.chunk === "string") playPcmBase64Chunk(data.chunk);
    });
    socket.on("ptt_ended", () => setSpeakingUser(null));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => {
      setStatus("error");
      setStatusMessage("Connection failed");
    });
  }, [token, groups, serverUrl, isWebView]);

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
      if (isWebView) bridgePttStart(groupId);
      else if (socketRef.current?.connected) socketRef.current.emit("ptt_start", { groupId });
      setPttActive(true);
    },
    [isWebView]
  );

  const pttEnd = useCallback(
    (groupId: string) => {
      if (isWebView) bridgePttEnd(groupId);
      else if (socketRef.current?.connected) socketRef.current.emit("ptt_end", { groupId });
      setPttActive(false);
    },
    [isWebView]
  );

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await walkietalkieApi.listGroups();
        if (cancelled) return;
        setGroups(list);
        if (list.length > 0 && !selectedGroupId) setSelectedGroupId(String(list[0].id));
        if (list.length > 0 && !hasAutoConnected.current) {
          hasAutoConnected.current = true;
          if (isWebView) {
            connectWalkieTalkie(serverUrl, token, list.map((g) => String(g.id)));
            setStatusMessage("Connecting…");
          } else {
            setStatusMessage("Connecting…");
            const socket = io(serverUrl, { path: "/socket.io/", transports: ["websocket", "polling"] });
            socketRef.current = socket;
            socket.on("connect", () => {
              socket.emit("auth", { token }, (ack: unknown) => {
                if (ack && typeof ack === "object" && (ack as { success?: boolean }).success) {
                  socket.emit("join_groups", { groupIds: list.map((g) => String(g.id)) });
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
              setSpeakingUser({
                userId: data.userId ?? 0,
                name: data.name,
                groupId: data.groupId ?? "",
              });
            });
            socket.on("ptt_audio", (data: { chunk?: string }) => {
              if (typeof data.chunk === "string") playPcmBase64Chunk(data.chunk);
            });
            socket.on("ptt_ended", () => setSpeakingUser(null));
            socket.on("disconnect", () => setStatus("disconnected"));
            socket.on("connect_error", () => {
              setStatus("error");
              setStatusMessage("Connection failed");
            });
          }
        }
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, token, serverUrl, isWebView]);

  useEffect(() => {
    if (!isWebView) return;
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
        const data = JSON.parse(jsonStr) as { chunk?: string };
        if (typeof data.chunk === "string") playPcmBase64Chunk(data.chunk);
      } catch {
        // ignore
      }
    };
    const onPTTEnded = () => setSpeakingUser(null);
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
    isWebView,
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
