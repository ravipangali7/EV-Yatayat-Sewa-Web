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
import AppBar from "@/components/app/AppBar";
import { CreditCard, Search } from "lucide-react";

function CardDisplay({
  card,
  selected,
  onSelect,
}: {
  card: CardType | { id: string; card_number: string; balance: number };
  selected?: boolean;
  onSelect?: () => void;
}) {
  const num = "card_number" in card ? card.card_number : "";
  const balance = "balance" in card ? toNumber((card as CardType).balance, 0) : (card as { balance: number }).balance;
  const last4 = num.length >= 4 ? num.slice(-4) : num;
  const masked = num.length > 4 ? "•••• •••• •••• " + last4 : num;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl overflow-hidden transition-all ${
        selected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <div className="gradient-primary rounded-2xl p-5 min-h-[120px] shadow-lg text-primary-foreground flex flex-col justify-between aspect-[1.586/1] max-w-[320px]">
        <div className="flex items-start justify-between">
          <CreditCard size={28} className="opacity-90" />
          <span className="text-xs font-medium opacity-90">Balance</span>
        </div>
        <div>
          <p className="font-mono text-sm tracking-widest opacity-90">{masked}</p>
          <p className="text-xl font-bold mt-1">Rs. {balance.toLocaleString()}</p>
        </div>
      </div>
    </button>
  );
}

export default function CardTopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [card, setCard] = useState<CardType | null>(null);
  const [myCards, setMyCards] = useState<CardType[]>([]);
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
    cardApi.list({ user: user.id, per_page: 20 })
      .then((res) => setMyCards(res.results ?? []))
      .catch(() => setMyCards([]));
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

  const selectMyCard = (c: CardType) => {
    setCard(c);
    setCardNumber("");
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
    <div className="min-h-screen pb-24">
      <AppBar title="Card Topup" showBack onBack={() => navigate(-1)} />
      <div className="px-5 pt-4">
      <p className="text-sm text-muted-foreground mb-4">Wallet balance: Rs. {walletBalance.toLocaleString()}</p>

      {myCards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Select your card</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {myCards.map((c) => (
              <div key={c.id} className="snap-center shrink-0">
                <CardDisplay
                  card={c}
                  selected={card?.id === c.id}
                  onSelect={() => selectMyCard(c)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Or search by card number</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter card number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="flex-1 h-12 rounded-xl"
          />
          <Button onClick={handleSearchCard} disabled={searching} className="rounded-xl h-12 px-4">
            <Search size={18} className="mr-1" /> {searching ? "..." : "Search"}
          </Button>
        </div>
      </div>

      {card && (
        <>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Selected card</p>
            <CardDisplay card={card} selected />
          </div>
          <div className="space-y-4">
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
          </div>
        </>
      )}

      {!card && myCards.length === 0 && (
        <p className="text-sm text-muted-foreground">Search a card by number to top up.</p>
      )}

      {/* Confirm dialog */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${confirmOpen ? "" : "hidden"}`}
        onClick={() => !submitting && setConfirmOpen(false)}
      >
        <div
          className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold text-lg mb-2">Confirm topup</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pay Rs. {numAmount.toLocaleString()} from wallet to card?
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
    </div>
  );
}
