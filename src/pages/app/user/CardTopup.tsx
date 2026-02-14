import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { cardApi } from "@/modules/cards/services/cardApi";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { toNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Card as CardType } from "@/types";

export default function CardTopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [card, setCard] = useState<CardType | null>(null);
  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    walletApi.list({ user: user.id, per_page: 1 })
      .then((res) => {
        const w = res.results[0];
        if (w) setWalletBalance(toNumber(w.balance, 0));
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSearchCard = async () => {
    const num = (cardNumber || "").trim();
    if (!num) {
      toast.error("Enter card number");
      return;
    }
    setSearching(true);
    setCard(null);
    try {
      const c = await cardApi.searchByNumber(num);
      setCard(c);
    } catch {
      toast.error("Card not found");
      setCard(null);
    } finally {
      setSearching(false);
    }
  };

  const numAmount = parseFloat(amount || "0");
  const validAmount = Number.isFinite(numAmount) && numAmount > 0;
  const canPay = validAmount && walletBalance >= numAmount;

  const handleConfirmTopup = async () => {
    if (!card || !validAmount) return;
    setSubmitting(true);
    try {
      await cardApi.topup(card.id, numAmount);
      toast.success("Topup successful");
      setConfirmOpen(false);
      setAmount("");
      setCard(null);
      setCardNumber("");
      navigate("/app/user/card");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { code?: string } } };
      if (ax?.response?.data?.code === "insufficient_balance") {
        toast.error("Insufficient wallet balance");
      } else {
        toast.error("Topup failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-6 pb-24">
      <h2 className="text-lg font-bold mb-4">Card Topup</h2>
      <p className="text-sm text-muted-foreground mb-4">Wallet balance: Rs. {walletBalance.toLocaleString()}</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Card number</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter card number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="flex-1 h-12 rounded-xl"
            />
            <Button onClick={handleSearchCard} disabled={searching} className="rounded-xl">
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {card && (
          <div className="app-surface rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">Selected card</p>
            <p className="font-mono font-medium">{card.card_number}</p>
            <p className="text-sm">Balance: Rs. {toNumber(card.balance, 0).toLocaleString()}</p>
          </div>
        )}

        {card && (
          <>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (Rs.)</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-xl"
              />
              {validAmount && walletBalance < numAmount && (
                <p className="text-xs text-destructive mt-1">Insufficient wallet balance. Recharge wallet first.</p>
              )}
            </div>
            <Button
              className="w-full h-12 rounded-xl"
              disabled={!validAmount || walletBalance < numAmount || submitting}
              onClick={() => setConfirmOpen(true)}
            >
              Pay from wallet
            </Button>
          </>
        )}
      </div>

      <Button variant="outline" className="w-full mt-6 rounded-xl" onClick={() => navigate(-1)}>
        Back
      </Button>

      {/* Confirm dialog */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${confirmOpen ? "" : "hidden"}`}
        onClick={() => !submitting && setConfirmOpen(false)}
      >
        <div
          className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold text-lg mb-2">Confirm topup</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pay Rs. {numAmount.toLocaleString()} from wallet to card {card?.card_number}?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirmTopup} disabled={submitting}>
              {submitting ? "Processing..." : "Pay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
