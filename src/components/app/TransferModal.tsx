import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceSearchButton } from "@/components/app/VoiceSearchButton";
import { userApi } from "@/modules/users/services/userApi";
import { walletApi } from "@/modules/wallets/services/walletApi";
import type { User } from "@/types";
import { toast } from "sonner";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserId?: string;
}

export default function TransferModal({
  open,
  onClose,
  onSuccess,
  currentUserId,
}: TransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doSearch = useCallback(async () => {
    const q = (searchQuery || "").trim();
    if (q.length < 10) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const user = await userApi.getByPhone(q);
      if (!user) {
        setResults([]);
        return;
      }
      if (currentUserId && String(user.id) === String(currentUserId)) {
        setResults([]);
        return;
      }
      setResults([user]);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, currentUserId]);

  useEffect(() => {
    if (!open) return;
    const q = (searchQuery || "").trim();
    if (q.length < 10) {
      setResults([]);
      return;
    }
    const t = setTimeout(doSearch, 400);
    return () => clearTimeout(t);
  }, [open, searchQuery, doSearch]);

  const handleClose = () => {
    setSearchQuery("");
    setResults([]);
    setSelectedUser(null);
    setAmount("");
    onClose();
  };

  const handleSelect = (u: User) => {
    setSelectedUser(u);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setAmount("");
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await walletApi.transfer(num, selectedUser.id);
      toast.success(`Transferred Rs. ${num.toFixed(2)} to ${selectedUser.name || selectedUser.phone}`);
      onSuccess?.();
      handleClose();
    } catch {
      // error already shown by API interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Transfer</DialogTitle>
          <DialogDescription>Enter recipient&apos;s exact phone number, then select and enter amount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!selectedUser ? (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter recipient's exact phone number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <VoiceSearchButton onResult={setSearchQuery} size="default" variant="outline" />
              </div>
              {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full text-left app-glass-card rounded-xl p-3 border border-border/50 hover:bg-muted/50"
                  >
                    <span className="font-medium">{u.name || "No name"}</span>
                    <span className="text-muted-foreground text-sm ml-2">{u.phone}</span>
                  </button>
                ))}
                {!searching && searchQuery.trim().length >= 10 && results.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No user found with this phone number.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl p-3 bg-muted/30 border">
                <p className="font-medium">{selectedUser.name || "No name"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Amount (Rs.)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleSubmit}
                  disabled={submitting || !amount || parseFloat(amount) <= 0}
                >
                  {submitting ? "Transferring…" : "Transfer"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
