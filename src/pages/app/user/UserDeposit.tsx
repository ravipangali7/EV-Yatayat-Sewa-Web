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

const MIN_AMOUNT_NPR = 200;

export default function UserDeposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [particulars, setParticulars] = useState("");
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
        particulars: particulars.trim() || undefined,
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
    <div className="min-h-screen">
      <AppBar title="Deposit" showBack onBack={() => navigate(-1)} />
      <div className="px-5 pt-4">
      <div className="app-glass-card rounded-2xl p-5 border border-border/50 mb-6">
        <p className="text-sm text-muted-foreground">Current balance</p>
        <p className="text-2xl font-bold">Rs. {balance.toLocaleString()}</p>
      </div>
      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Amount (Rs.) — min {MIN_AMOUNT_NPR}</label>
          <Input
            type="number"
            min={MIN_AMOUNT_NPR}
            step="1"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Remarks (optional)</label>
          <Input
            type="text"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Particulars (optional)</label>
          <Input
            type="text"
            placeholder="Particulars"
            value={particulars}
            onChange={(e) => setParticulars(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl" disabled={submitting}>
          {submitting ? "Redirecting to payment..." : "Proceed to Payment"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">You will be redirected to ConnectIPS to complete the payment.</p>
      <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => navigate(-1)}>
        Back
      </Button>
      </div>
    </div>
  );
}
