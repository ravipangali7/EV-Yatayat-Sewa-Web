import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { cardApi } from "@/modules/cards/services/cardApi";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { paymentApi } from "@/modules/payments/services/paymentApi";
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
  const canPayFromWallet = validAmount && walletBalance >= numAmount;
  const MIN_NCHL = 10;
  const canDirectPay = validAmount && numAmount >= MIN_NCHL;

  const handlePayWithConnectIPS = async () => {
    if (!card || !validAmount) return;
    if (numAmount < MIN_NCHL) {
      toast.error(`Minimum amount for ConnectIPS is Rs. ${MIN_NCHL}`);
      return;
    }
    setSubmitting(true);
    try {
      const formData = await paymentApi.initiatePayment({
        amount: numAmount,
        purpose: "card_topup",
        card_id: card.id,
      });
      const gatewayUrl = formData.gateway_url;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = gatewayUrl;
      form.style.display = "none";
      const keys = ["MERCHANTID", "APPID", "APPNAME", "TXNID", "TXNDATE", "TXNCRNCY", "TXNAMT", "REFERENCEID", "REMARKS", "PARTICULARS", "TOKEN"];
      for (const key of keys) {
        const value = (formData as Record<string, string>)[key];
        if (value != null) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax?.response?.data?.error || "Failed to start payment");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-background pb-24">
      <AppBar title="Card Topup" showBack onBack={() => navigate(-1)} />
      <div className="px-5 pt-4 space-y-5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Rs. {walletBalance.toLocaleString()}
          </span>
        </div>

        {myCards.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Your Cards</p>
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

        <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 shadow-md space-y-3">
          <p className="text-sm font-semibold">Search by card number</p>
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
          <div className="bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 shadow-md space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected Card</p>
            <CardDisplay card={card} selected />
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Amount (Rs.)</label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-lg">NPR</span>
              </div>
              {validAmount && walletBalance < numAmount && (
                <p className="text-xs text-muted-foreground mt-1">Insufficient wallet balance. Use ConnectIPS or recharge wallet first.</p>
              )}
              {validAmount && numAmount > 0 && numAmount < MIN_NCHL && (
                <p className="text-xs text-muted-foreground mt-1">ConnectIPS requires minimum Rs. {MIN_NCHL}.</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60"
                disabled={submitting || !canPayFromWallet}
                onClick={() => setConfirmOpen(true)}
              >
                Pay from Wallet
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                disabled={submitting || !canDirectPay}
                onClick={handlePayWithConnectIPS}
              >
                {submitting ? "Redirecting..." : "Pay from e/banking"}
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
            {validAmount && !canPayFromWallet && !canDirectPay && (
              <p className="text-xs text-muted-foreground">Enter at least Rs. {MIN_NCHL} for e/banking, or recharge wallet.</p>
            )}
          </div>
        )}

        {!card && myCards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Search a card by number to top up.</p>
        )}

        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${confirmOpen ? "" : "hidden"}`}
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2">Confirm Topup</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Pay <strong>Rs. {numAmount.toLocaleString()}</strong> from wallet to card?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button className="flex-1 h-11 rounded-xl" onClick={handleConfirmTopup} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
