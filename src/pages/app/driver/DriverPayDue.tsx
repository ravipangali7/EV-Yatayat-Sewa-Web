import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Receipt, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { toNumber } from "@/lib/utils";

export default function DriverPayDue() {
  const { user } = useAuth();
  const [toPay, setToPay] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = res.results[0];
      setToPay(wallet ? toNumber(wallet.to_pay, 0) : 0);
    } catch {
      setToPay(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen">
      <AppBar title="Pay Due" showBack />
      <div className="px-5 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-glass-card rounded-2xl p-6 border border-border/50 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Receipt size={24} className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount due</p>
              {loading ? (
                <p className="text-xl font-bold">...</p>
              ) : (
                <p className="text-2xl font-bold">Rs. {toPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Settle your dues from the wallet. You can transfer or pay from the Wallet page.
          </p>
          <Button asChild className="w-full rounded-xl" size="lg">
            <Link to="/app/driver/wallet">
              <Wallet size={18} className="mr-2" />
              Go to Wallet
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
