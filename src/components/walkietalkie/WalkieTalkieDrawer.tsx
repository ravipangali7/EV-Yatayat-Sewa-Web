import { useEffect, useState, useRef } from "react";
import { Mic, Play, Pause, Radio, RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";
import { format } from "date-fns";
import {
  walkietalkieApi,
  type WalkieTalkieRecording,
  type WalkieTalkieDriver,
  type WalkieTalkieAdmin,
  type AdminDriverVoiceMessage,
} from "@/modules/walkietalkie/services/walkietalkieApi";

function getInitials(name: string | undefined, id: number): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return String(id).slice(-2);
}

export function WalkieTalkieDrawer() {
  const { user } = useAuth();
  const {
    drawerOpen,
    closeDrawer,
    status,
    statusMessage,
    groups,
    admins,
    recordings,
    selectedGroupId,
    setSelectedGroupId,
    pttActive,
    speakingUser,
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
    connect,
    retryConnect,
    playDirectMessage,
    activeDirectMessageId,
  } = useWalkieTalkie();
  const [drivers, setDrivers] = useState<WalkieTalkieDriver[]>([]);
  const [directMessages, setDirectMessages] = useState<AdminDriverVoiceMessage[]>([]);
  const [driverInboxMessages, setDriverInboxMessages] = useState<AdminDriverVoiceMessage[]>([]);
  const isSuperuser = !!user?.is_superuser;
  const isDriver = !!user?.is_driver;
  const pttButtonRef = useRef<HTMLButtonElement>(null);

  const isDirect = selectedGroupId.startsWith("direct:");
  const directIdNum = isDirect ? Number(selectedGroupId.slice(7)) : null;
  const directDriverId = isDirect && isSuperuser ? directIdNum : null;
  const selectedAdmin: WalkieTalkieAdmin | null = isDirect && isDriver ? (admins.find((a) => a.id === directIdNum) ?? null) : null;

  useEffect(() => {
    if (groups.length === 0) return;
    const isDirect = selectedGroupId.startsWith("direct:");
    const inList = groups.some((g) => String(g.id) === selectedGroupId);
    if (!isDirect && !inList) setSelectedGroupId(String(groups[0].id));
  }, [groups, selectedGroupId, setSelectedGroupId]);

  useEffect(() => {
    if (!drawerOpen) return;
    if (selectedGroupId.startsWith("direct:") || selectedGroupId === "direct") return;
    const groupId = selectedGroupId ? Number(selectedGroupId) : undefined;
    fetchRecordings(
      groupId != null && !Number.isNaN(groupId) ? { group_id: groupId } : undefined
    );
  }, [drawerOpen, selectedGroupId, fetchRecordings]);

  useEffect(() => {
    if (!drawerOpen || selectedGroupId.startsWith("direct:") || selectedGroupId === "direct") return;
    const groupId = Number(selectedGroupId);
    if (Number.isNaN(groupId)) return;
    const interval = setInterval(() => fetchRecordings({ group_id: groupId }), 10000);
    return () => clearInterval(interval);
  }, [drawerOpen, selectedGroupId, fetchRecordings]);

  useEffect(() => {
    if (!drawerOpen || !isSuperuser) return;
    walkietalkieApi.listDrivers().then(setDrivers).catch(() => setDrivers([]));
  }, [drawerOpen, isSuperuser]);

  useEffect(() => {
    if (!drawerOpen || !isDirect || directDriverId == null) return;
    walkietalkieApi.listDirectMessages({ driver_id: directDriverId }).then(setDirectMessages).catch(() => setDirectMessages([]));
  }, [drawerOpen, isDirect, directDriverId]);

  useEffect(() => {
    if (!drawerOpen || !isDirect || directDriverId == null) return;
    const interval = setInterval(
      () => walkietalkieApi.listDirectMessages({ driver_id: directDriverId }).then(setDirectMessages).catch(() => {}),
      10000
    );
    return () => clearInterval(interval);
  }, [drawerOpen, isDirect, directDriverId]);

  useEffect(() => {
    if (!drawerOpen || !isDriver || isSuperuser) return;
    walkietalkieApi.listDirectMessages({ recipient: "me" }).then(setDriverInboxMessages).catch(() => setDriverInboxMessages([]));
  }, [drawerOpen, isDriver, isSuperuser]);

  useEffect(() => {
    if (!drawerOpen || !isDriver || isSuperuser) return;
    const interval = setInterval(
      () => walkietalkieApi.listDirectMessages({ recipient: "me" }).then(setDriverInboxMessages).catch(() => {}),
      10000
    );
    return () => clearInterval(interval);
  }, [drawerOpen, isDriver, isSuperuser]);

  const isConnected = status === "connected";
  const canTalk = isConnected && !!selectedGroupId && !speakingUser;
  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);
  const selectedDriver = directDriverId != null ? drivers.find((d) => d.id === directDriverId) : null;
  const displayRecordings =
    selectedGroupId.startsWith("direct:") || selectedGroupId === "direct" ? [] : recordings;
  const displayDirectMessages = isDirect ? directMessages : [];

  const handleSelectDriver = (driver: WalkieTalkieDriver) => {
    setSelectedGroupId(`direct:${driver.id}`);
    joinDirectRoom(driver.id);
  };

  const StatusIcon = isConnected ? Wifi : status === "error" ? AlertCircle : WifiOff;
  const statusVariant = isConnected
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
    : status === "error"
      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600";

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] flex flex-col rounded-t-3xl border-t border-x p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Walkie-Talkie</SheetTitle>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Walkie-Talkie</h2>
              <p className="text-xs text-muted-foreground">Push to talk in channels</p>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusVariant}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {isConnected ? "Live" : status === "error" ? statusMessage || "Error" : "Offline"}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-2 px-5 pb-3">
          {status === "error" && (
            <Button size="sm" variant="outline" className="rounded-xl gap-2" onClick={retryConnect}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
          {!isConnected && groups.length > 0 && status !== "error" && (
            <Button size="sm" className="rounded-xl gap-2" onClick={connect}>
              <Wifi className="h-4 w-4" />
              Connect
            </Button>
          )}
        </div>

        {/* Messages from admin (driver only) */}
        {isDriver && !isSuperuser && driverInboxMessages.length > 0 && (
          <div className="shrink-0 px-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Messages from admin
            </p>
            <div className="space-y-1.5 max-h-32 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-card p-2">
              {driverInboxMessages.slice(0, 10).map((msg) => (
                <DirectMessageRow
                  key={msg.id}
                  msg={msg}
                  isActive={activeDirectMessageId === msg.id}
                  isPlaying={isPlaybackPlaying}
                  currentTime={playbackCurrentTime}
                  duration={playbackDuration}
                  onPlay={() => {
                    playDirectMessage(msg.id, msg.sample_rate ?? 48000);
                    walkietalkieApi.markDirectMessageRead(msg.id).catch(() => {});
                  }}
                  onPause={pausePlayback}
                />
              ))}
            </div>
          </div>
        )}

        {/* Channels */}
        <div className="shrink-0 px-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Channels
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
            {groups.map((g) => {
              const isSelected = String(g.id) === selectedGroupId;
              const initial = g.name.charAt(0).toUpperCase();
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(String(g.id))}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-4 py-2.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-slate-200 dark:border-slate-700 bg-card hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Avatar className={`h-8 w-8 ${isSelected ? "ring-2 ring-primary-foreground/30" : ""}`}>
                    <AvatarFallback className="text-xs font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">{g.name}</span>
                </button>
              );
            })}
            {isSuperuser &&
              drivers.map((d) => {
                const directId = `direct:${d.id}`;
                const isSelected = selectedGroupId === directId;
                return (
                  <button
                    key={directId}
                    type="button"
                    onClick={() => handleSelectDriver(d)}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-4 py-2.5 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-500 text-white shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-card hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Avatar className={`h-8 w-8 ${isSelected ? "ring-2 ring-white/30" : ""}`}>
                      {d.avatar ? <AvatarImage src={d.avatar} alt={d.name} /> : null}
                      <AvatarFallback className="text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        {d.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[100px] truncate">{d.name}</span>
                  </button>
                );
              })}
            {isDriver &&
              !isSuperuser &&
              admins.map((admin) => {
                const directId = `direct:${admin.id}`;
                const isSelected = selectedGroupId === directId;
                return (
                  <button
                    key={directId}
                    type="button"
                    onClick={() => setSelectedGroupId(directId)}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-4 py-2.5 transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-500 text-white shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-card hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Avatar className={`h-8 w-8 ${isSelected ? "ring-2 ring-white/30" : ""}`}>
                      {admin.avatar ? <AvatarImage src={admin.avatar} alt={admin.name} /> : null}
                      <AvatarFallback className="text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        {admin.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[100px] truncate">{admin.name}</span>
                  </button>
                );
              })}
          </div>
          {(selectedGroup || selectedDriver || selectedAdmin) && (
            <p className="text-xs text-muted-foreground mt-2">
              {selectedGroup ? `In ${selectedGroup.name}` : selectedDriver ? `Direct → ${selectedDriver.name}` : selectedAdmin ? `Direct → ${selectedAdmin.name}` : ""}
            </p>
          )}
          {groups.length === 0 && !isSuperuser && (!isDriver || admins.length === 0) && (
            <p className="text-sm text-muted-foreground mt-2">No channels. Ask admin to add you to one.</p>
          )}
        </div>

        {/* Voice messages - compact so 5-10 visible at once */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5 shrink-0">
            Voice messages
          </p>
          <div className="flex-1 overflow-auto px-2 pb-2 space-y-1 min-h-0">
            {isDirect ? (
              displayDirectMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-2">
                    <Mic className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">No direct voice messages yet.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Hold the button below to send one.</p>
                </div>
              ) : (
                displayDirectMessages.map((msg) => (
                  <DirectMessageRow
                    key={msg.id}
                    msg={msg}
                    isActive={activeDirectMessageId === msg.id}
                    isPlaying={isPlaybackPlaying}
                    currentTime={playbackCurrentTime}
                    duration={playbackDuration}
                    onPlay={() => playDirectMessage(msg.id, msg.sample_rate ?? 48000)}
                    onPause={pausePlayback}
                  />
                ))
              )
            ) : displayRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-2">
                  <Mic className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">No voice messages in this channel yet.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Hold the button below to send one.</p>
              </div>
            ) : (
              displayRecordings.map((rec) => (
                <VoiceMessageRow
                  key={rec.id}
                  rec={rec}
                  isActive={activeRecordingId === rec.id}
                  isPlaying={isPlaybackPlaying}
                  currentTime={playbackCurrentTime}
                  duration={playbackDuration}
                  onPlay={() => playRecording(rec.id)}
                  onPause={pausePlayback}
                />
              ))
            )}
          </div>
        </div>

        {/* PTT area - small Hold to talk button */}
        <div className="shrink-0 p-3 pt-2 bg-gradient-to-t from-slate-100 to-transparent dark:from-slate-900/80">
          {speakingUser && (
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium">
                {speakingUser.name || `User ${speakingUser.userId}`} is speaking…
              </span>
            </div>
          )}
          <button
            ref={pttButtonRef}
            type="button"
            disabled={!canTalk}
            aria-disabled={!canTalk}
            className={`w-full touch-manipulation select-none rounded-xl py-2.5 flex flex-row items-center justify-center gap-2 transition-all shadow border outline-none ${
              pttActive
                ? "cursor-pointer border-rose-500/30 bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] shadow-rose-500/30"
                : !canTalk
                  ? "opacity-50 cursor-not-allowed pointer-events-none border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  : "cursor-pointer border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
            }`}
            style={{ touchAction: "none" }}
            onMouseDown={() => canTalk && pttStart(selectedGroupId)}
            onMouseUp={() => selectedGroupId && pttEnd(selectedGroupId)}
            onMouseLeave={() => selectedGroupId && pttEnd(selectedGroupId)}
            onTouchStart={(e) => {
              e.preventDefault();
              if (canTalk) pttStart(selectedGroupId);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (selectedGroupId) pttEnd(selectedGroupId);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              if (selectedGroupId) pttEnd(selectedGroupId);
            }}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform ${
                pttActive ? "scale-110" : ""
              }`}
            >
              <Mic className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold">
              {pttActive ? "Speaking…" : speakingUser ? `Wait for ${speakingUser.name || `User ${speakingUser.userId}`} to finish` : "Hold to talk"}
            </span>
            {(selectedGroup || selectedDriver) && (
              <span className="text-[10px] opacity-90 truncate max-w-[100px]">
                in {selectedGroup?.name ?? selectedDriver?.name ?? "channel"}
              </span>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DirectMessageRow({
  msg,
  isActive,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
}: {
  msg: AdminDriverVoiceMessage;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
}) {
  const name = msg.sender_name ?? `User #${msg.sender}`;
  const initials = getInitials(msg.sender_name ?? undefined, msg.sender);
  const totalSeconds = msg.duration_seconds != null && msg.duration_seconds > 0 ? msg.duration_seconds : duration;
  const displayDuration = isActive ? duration : totalSeconds;
  const displayCurrent = isActive ? currentTime : 0;
  const progressPercent = displayDuration > 0 ? (displayCurrent / displayDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-card py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[9px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-[11px] font-semibold truncate text-foreground leading-tight">{name}</p>
          <span className="text-[9px] text-muted-foreground shrink-0">
            {format(new Date(msg.created_at), "d MMM HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800/80 py-1 px-1.5">
          <button
            type="button"
            className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-2.5 w-2.5" />
            ) : (
              <Play className="h-2.5 w-2.5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className="h-0.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={isActive ? displayCurrent : undefined}
              aria-valuemin={0}
              aria-valuemax={isActive ? displayDuration : undefined}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[9px] font-medium tabular-nums text-muted-foreground shrink-0 w-8 text-right">
            {isActive
              ? `${formatTime(displayCurrent)}/${formatTime(displayDuration)}`
              : formatTime(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function VoiceMessageRow({
  rec,
  isActive,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
}: {
  rec: WalkieTalkieRecording;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
}) {
  const name = rec.user_name ?? `User #${rec.user}`;
  const initials = getInitials(rec.user_name, rec.user);
  // Use stored duration_seconds, or compute from started_at/ended_at for old recordings, or playback duration when active
  const computedFromDates =
    rec.started_at && rec.ended_at
      ? (new Date(rec.ended_at).getTime() - new Date(rec.started_at).getTime()) / 1000
      : 0;
  const totalSeconds =
    rec.duration_seconds != null && rec.duration_seconds > 0
      ? rec.duration_seconds
      : computedFromDates > 0
        ? computedFromDates
        : duration;
  const displayDuration = isActive ? duration : totalSeconds;
  const displayCurrent = isActive ? currentTime : 0;
  const progressPercent = displayDuration > 0 ? (displayCurrent / displayDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-card py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <Avatar className="h-7 w-7 shrink-0">
        {rec.user_avatar ? (
          <AvatarImage src={rec.user_avatar} alt={name} />
        ) : null}
        <AvatarFallback className="text-[9px] font-medium bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className="text-[11px] font-semibold truncate text-foreground leading-tight">{name}</p>
          <span className="text-[9px] text-muted-foreground shrink-0">
            {format(new Date(rec.started_at), "d MMM HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800/80 py-1 px-1.5">
          <button
            type="button"
            className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-2.5 w-2.5" />
            ) : (
              <Play className="h-2.5 w-2.5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className="h-0.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={isActive ? displayCurrent : undefined}
              aria-valuemin={0}
              aria-valuemax={isActive ? displayDuration : undefined}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[9px] font-medium tabular-nums text-muted-foreground shrink-0 w-8 text-right">
            {isActive
              ? `${formatTime(displayCurrent)}/${formatTime(displayDuration)}`
              : formatTime(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
