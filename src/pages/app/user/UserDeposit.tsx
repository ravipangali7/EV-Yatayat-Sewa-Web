import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { toNumber } from "@/lib/utils";
import { toast } from "sonner";

export default function UserDeposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
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
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const data = await walletApi.deposit(num);
      toast.success("Deposit successful");
      setBalance(toNumber(data?.balance, balance) || balance + num);
      setAmount("");
    } catch {
      toast.error("Deposit failed");
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
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl" disabled={submitting}>
          {submitting ? "Processing..." : "Add money"}
        </Button>
      </form>
      <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => navigate(-1)}>
        Back
      </Button>
      </div>
    </div>
  );
}
