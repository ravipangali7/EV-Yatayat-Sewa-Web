import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Receipt, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { paymentApi } from "@/modules/payments/services/paymentApi";
import { toNumber } from "@/lib/utils";
import { toast } from "sonner";

const MIN_AMOUNT_NPR = 10;

export default function DriverPayDue() {
  const { user } = useAuth();
  const [toPay, setToPay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handlePay = async () => {
    if (toPay < MIN_AMOUNT_NPR) {
      toast.error(`Minimum payment is Rs. ${MIN_AMOUNT_NPR}`);
      return;
    }
    setSubmitting(true);
    try {
      const formData = await paymentApi.initiatePayment({
        amount: toPay,
        purpose: "pay_due",
        remarks: "Pay due",
        return_to: "pay_due",
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
            Pay your dues via NCHL ConnectIPS. On success, the amount will be deducted from your due balance.
          </p>
          {toPay >= MIN_AMOUNT_NPR ? (
            <Button
              type="button"
              className="w-full rounded-xl"
              size="lg"
              disabled={submitting || loading}
              onClick={handlePay}
            >
              <CreditCard size={18} className="mr-2" />
              {submitting ? "Redirecting to payment..." : "Pay"}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full rounded-xl" size="lg">
              <Link to="/app/driver/wallet">Go to Wallet</Link>
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
