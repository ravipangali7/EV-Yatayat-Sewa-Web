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
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await userApi.list({ search: q, per_page: 10 });
      const list = (res.results || []).filter(
        (u) => currentUserId && String(u.id) !== String(currentUserId)
      );
      setResults(list);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, currentUserId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [open, doSearch]);

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
      await walletApi.transfer(num, selectedUser.phone);
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
          <DialogDescription>Search by phone or name and enter amount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!selectedUser ? (
            <>
              <Input
                placeholder="Search by phone or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl"
              />
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
                {!searching && searchQuery.trim().length >= 2 && results.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No users found.</p>
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
