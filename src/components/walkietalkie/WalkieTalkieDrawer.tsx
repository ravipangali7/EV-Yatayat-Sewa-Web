import { useEffect, useState } from "react";
import { Mic, Play } from "lucide-react";
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
    joinDirectRoom,
    connect,
  } = useWalkieTalkie();
  const [drivers, setDrivers] = useState<WalkieTalkieDriver[]>([]);
  const isSuperuser = !!user?.is_superuser;

  useEffect(() => {
    if (!drawerOpen) return;
    if (selectedGroupId.startsWith("direct:") || selectedGroupId === "direct") return;
    const groupId = selectedGroupId ? Number(selectedGroupId) : undefined;
    fetchRecordings(
      groupId != null && !Number.isNaN(groupId) ? { group_id: groupId } : undefined
    );
  }, [drawerOpen, selectedGroupId, fetchRecordings]);

  useEffect(() => {
    if (!drawerOpen || !isSuperuser) return;
    walkietalkieApi.listDrivers().then(setDrivers).catch(() => setDrivers([]));
  }, [drawerOpen, isSuperuser]);

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
            {isConnected ? "Listening" : status === "error" ? statusMessage || "Error" : "Disconnected"}
          </span>
        </SheetHeader>

        {!isConnected && groups.length > 0 && (
          <Button size="sm" variant="outline" className="mb-2 w-fit" onClick={connect}>
            Connect
          </Button>
        )}

        <div className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Group</p>
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
              {isSuperuser && (
                <button
                  type="button"
                  onClick={() => setSelectedGroupId("direct")}
                  className={`flex shrink-0 flex-col items-center gap-1 transition-all ${
                    selectedGroupId === "direct" || selectedGroupId.startsWith("direct:")
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full"
                      : ""
                  }`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      D
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground max-w-[4rem] truncate">Direct</span>
                </button>
              )}
            </div>
            {selectedGroup && (
              <p className="text-xs text-muted-foreground mt-1">In {selectedGroup.name}</p>
            )}
            {selectedGroupId === "direct" && (
              <p className="text-xs text-muted-foreground mt-1">Talk to driver</p>
            )}
            {selectedDriver && (
              <p className="text-xs text-muted-foreground mt-1">Direct to {selectedDriver.name}</p>
            )}
            {selectedGroupId === "direct" && drivers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {drivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDriver(d)}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      {d.avatar ? <AvatarImage src={d.avatar} alt={d.name} /> : null}
                      <AvatarFallback className="text-xs">{d.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{d.name}</span>
                  </button>
                ))}
              </div>
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
                  <VoiceMessageRow key={rec.id} rec={rec} onPlay={() => playRecording(rec.id)} />
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
              type="button"
              disabled={!isConnected || !selectedGroupId || selectedGroupId === "direct"}
              className="w-full touch-manipulation select-none rounded-xl bg-primary py-5 text-primary-foreground flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
              onMouseDown={() => selectedGroupId && pttStart(selectedGroupId)}
              onMouseUp={() => selectedGroupId && pttEnd(selectedGroupId)}
              onMouseLeave={() => selectedGroupId && pttEnd(selectedGroupId)}
              onTouchStart={(e) => {
                e.preventDefault();
                selectedGroupId && pttStart(selectedGroupId);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                selectedGroupId && pttEnd(selectedGroupId);
              }}
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

function VoiceMessageRow({ rec, onPlay }: { rec: WalkieTalkieRecording; onPlay: () => void }) {
  const name = rec.user_name ?? `User #${rec.user}`;
  const initials = getInitials(rec.user_name, rec.user);
  const duration = rec.duration_seconds != null ? `${Math.round(rec.duration_seconds)}s` : null;

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
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>
      <Button size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0" onClick={onPlay}>
        <Play className="h-5 w-5" />
      </Button>
    </div>
  );
}
