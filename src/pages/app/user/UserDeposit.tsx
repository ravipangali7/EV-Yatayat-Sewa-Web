import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { paymentApi } from "@/modules/payments/services/paymentApi";
import { toNumber } from "@/lib/utils";
import { toast } from "sonner";

const MIN_AMOUNT_NPR = 10;

export default function UserDeposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    walletApi.list({ user: user.id, per_page: 1 })
      .then((res) => {
        const w = res.results[0];
        if (w) setBalance(toNumber(w.balance, 0));
      })
      .catch(() => {});
  }, [user?.id]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num < MIN_AMOUNT_NPR) {
      toast.error(`Minimum amount is Rs. ${MIN_AMOUNT_NPR}`);
      return;
    }
    setSubmitting(true);
    try {
      const formData = await paymentApi.initiatePayment({
        amount: num,
        purpose: "wallet_deposit",
        remarks: remarks.trim() || undefined,
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

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Add Fund" showBack onBack={() => navigate(-1)} />
      <div className="px-5 pt-4 pb-24 space-y-5">
        <div className="rounded-2xl border border-border/60 border-l-4 border-l-emerald-500 bg-white/80 dark:bg-card/80 backdrop-blur-xl shadow-lg shadow-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rs. {balance.toLocaleString()}</p>
        </div>
        <form onSubmit={handleDeposit} className="space-y-4 bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-5 shadow-md hover:shadow-lg transition-shadow">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Amount (Rs.)</label>
            <div className="relative">
              <Input
                type="number"
                min={MIN_AMOUNT_NPR}
                step="1"
                placeholder={`Min Rs. ${MIN_AMOUNT_NPR}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-xl pr-16 text-base"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-lg">NPR</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Remarks <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              type="text"
              placeholder="e.g. Monthly deposit"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={submitting}>
            {submitting ? "Redirecting..." : "Proceed to Payment"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">You will be redirected to NCHL ConnectIPS</p>
        </form>
      </div>
    </div>
  );
}
