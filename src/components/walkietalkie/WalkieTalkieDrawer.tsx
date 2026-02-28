import { useEffect, useState, useRef } from "react";
import { Mic, Play, Pause } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
  } = useWalkieTalkie();
  const [drivers, setDrivers] = useState<WalkieTalkieDriver[]>([]);
  const isSuperuser = !!user?.is_superuser;
  const pttButtonRef = useRef<HTMLButtonElement>(null);

  // When groups load, ensure we have a valid selection so recordings fetch runs
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
    const el = pttButtonRef.current;
    if (!el) return;
    const opts: AddEventListenerOptions = { passive: false };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (selectedGroupId) pttStart(selectedGroupId);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (selectedGroupId) pttEnd(selectedGroupId);
    };
    el.addEventListener("touchstart", onTouchStart, opts);
    el.addEventListener("touchend", onTouchEnd, opts);
    return () => {
      el.removeEventListener("touchstart", onTouchStart, opts);
      el.removeEventListener("touchend", onTouchEnd, opts);
    };
  }, [selectedGroupId, pttStart, pttEnd]);

  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);
  const isDirect = selectedGroupId.startsWith("direct:");
  const directDriverId = isDirect ? Number(selectedGroupId.slice(7)) : null;
  const selectedDriver = directDriverId != null ? drivers.find((d) => d.id === directDriverId) : null;
  const displayRecordings =
    selectedGroupId.startsWith("direct:") || selectedGroupId === "direct" ? [] : recordings;
  const isConnected = status === "connected";

  const handleSelectDriver = (driver: WalkieTalkieDriver) => {
    setSelectedGroupId(`direct:${driver.id}`);
    joinDirectRoom(driver.id);
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="bottom"
        className="h-[75vh] flex flex-col rounded-t-2xl"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <SheetTitle>Walkie-Talkie</SheetTitle>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isConnected
                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                : status === "error"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-green-500" : status === "error" ? "bg-destructive" : "bg-muted-foreground"
              }`}
            />
            {isConnected ? "Listening" : status === "error" ? statusMessage || "Error" : (statusMessage || "Disconnected")}
          </span>
        </SheetHeader>

        {status === "error" && (
          <Button size="sm" variant="outline" className="mb-2 w-fit" onClick={retryConnect}>
            Retry
          </Button>
        )}
        {!isConnected && groups.length > 0 && status !== "error" && (
          <Button size="sm" variant="outline" className="mb-2 w-fit" onClick={connect}>
            Connect
          </Button>
        )}

        <div className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Group & drivers</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {groups.map((g) => {
                const isSelected = String(g.id) === selectedGroupId;
                const initial = g.name.charAt(0).toUpperCase();
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(String(g.id))}
                    className={`flex shrink-0 flex-col items-center gap-1 transition-all ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground max-w-[4rem] truncate">{g.name}</span>
                  </button>
                );
              })}
              {isSuperuser && drivers.map((d) => {
                const directId = `direct:${d.id}`;
                const isSelected = selectedGroupId === directId;
                return (
                  <button
                    key={directId}
                    type="button"
                    onClick={() => handleSelectDriver(d)}
                    className={`flex shrink-0 flex-col items-center gap-1 transition-all ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      {d.avatar ? <AvatarImage src={d.avatar} alt={d.name} /> : null}
                      <AvatarFallback className="text-sm bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        {d.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground max-w-[4rem] truncate">{d.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedGroup && (
              <p className="text-xs text-muted-foreground mt-1">In {selectedGroup.name}</p>
            )}
            {selectedDriver && (
              <p className="text-xs text-muted-foreground mt-1">Direct to {selectedDriver.name}</p>
            )}
            {groups.length === 0 && !isSuperuser && (
              <p className="text-sm text-muted-foreground mt-1">No groups. Add members in admin.</p>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Voice messages</p>
            <div className="flex-1 overflow-auto space-y-2 min-h-0">
              {displayRecordings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  {selectedGroupId.startsWith("direct:")
                    ? "No recordings for direct messages."
                    : "No voice messages in this group."}
                </p>
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

          <div className="pt-2 border-t">
            {speakingUser && (
              <p className="text-xs text-muted-foreground mb-2">
                {speakingUser.name || `User ${speakingUser.userId}`} is speaking…
              </p>
            )}
            <button
              ref={pttButtonRef}
              type="button"
              disabled={!isConnected || !selectedGroupId}
              className="w-full touch-manipulation select-none rounded-xl bg-primary py-5 text-primary-foreground flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
              onMouseDown={() => selectedGroupId && pttStart(selectedGroupId)}
              onMouseUp={() => selectedGroupId && pttEnd(selectedGroupId)}
              onMouseLeave={() => selectedGroupId && pttEnd(selectedGroupId)}
            >
              <Mic className={`h-9 w-9 ${pttActive ? "scale-110" : ""}`} />
              <span className="text-sm">{pttActive ? "Speaking…" : "Hold to talk"}</span>
            </button>
          </div>
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
  const totalSeconds = rec.duration_seconds ?? duration;
  const displayDuration = isActive ? duration : totalSeconds;
  const displayCurrent = isActive ? currentTime : 0;
  const progressPercent = displayDuration > 0 ? (displayCurrent / displayDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
      <Avatar className="h-10 w-10 shrink-0">
        {rec.user_avatar ? (
          <AvatarImage src={rec.user_avatar} alt={name} />
        ) : null}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(rec.started_at), "MMM d, HH:mm")}
        </p>
        <div className="flex items-center gap-2 mt-1.5 rounded-2xl bg-primary text-primary-foreground py-2 px-3 min-w-0 max-w-full w-fit">
          <button
            type="button"
            className="shrink-0 p-0.5 rounded-full hover:bg-primary-foreground/20"
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          <div
            className="flex-1 min-w-[60px] max-w-[120px] h-1.5 rounded-full bg-primary-foreground/30 overflow-hidden"
            role="progressbar"
            aria-valuenow={isActive ? displayCurrent : undefined}
            aria-valuemin={0}
            aria-valuemax={isActive ? displayDuration : undefined}
          >
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums shrink-0">
            {isActive
              ? `${formatTime(displayCurrent)} / ${formatTime(displayDuration)}`
              : formatTime(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
