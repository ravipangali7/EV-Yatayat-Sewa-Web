import { useEffect } from "react";
import { Mic, Play } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";
import { format } from "date-fns";

export function WalkieTalkieDrawer() {
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
    connect,
    disconnect,
  } = useWalkieTalkie();

  useEffect(() => {
    if (drawerOpen) fetchRecordings();
  }, [drawerOpen, fetchRecordings]);

  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="bottom"
        className="h-[75vh] flex flex-col rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>Walkie-Talkie</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-auto py-4">
          <div>
            <p className="text-sm font-medium mb-2">Status</p>
            <p className="text-sm text-muted-foreground">
              {status === "connected"
                ? "Connected"
                : status === "error"
                  ? statusMessage || "Error"
                  : "Disconnected"}
            </p>
            {status !== "connected" && groups.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={connect}
              >
                Connect
              </Button>
            )}
            {status === "connected" && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-muted-foreground"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Recordings</p>
            <div className="space-y-2 max-h-40 overflow-auto">
              {recordings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recordings yet.</p>
              ) : (
                recordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {format(new Date(rec.started_at), "MMM d, HH:mm")} – Group #{rec.group}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => playRecording(rec.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Push to talk</p>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mb-3"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={status !== "connected"}
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name} ({g.member_count} members)
                </option>
              ))}
            </select>
            {speakingUser && (
              <p className="text-sm text-muted-foreground mb-2">
                {speakingUser.name || `User ${speakingUser.userId}`} is speaking…
              </p>
            )}
            <button
              type="button"
              disabled={status !== "connected" || !selectedGroupId}
              className="w-full touch-manipulation select-none rounded-xl bg-primary py-6 text-primary-foreground flex flex-col items-center justify-center gap-2 disabled:opacity-50"
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
              <Mic className={`h-10 w-10 ${pttActive ? "scale-110" : ""}`} />
              <span className="text-sm">{pttActive ? "Speaking…" : "Hold to talk"}</span>
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {selectedGroup ? `In ${selectedGroup.name}` : "Select a group"}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
