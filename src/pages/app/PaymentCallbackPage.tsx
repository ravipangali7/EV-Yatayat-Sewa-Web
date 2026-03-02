import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { paymentApi } from "@/modules/payments/services/paymentApi";
import type { PaymentTransaction } from "@/types/payment";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAppRole, getHomePathForUser } from "@/config/appRoles";

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const txnId =
    searchParams.get("txn_id") ||
    searchParams.get("TXNID") ||
    (() => {
      try {
        const q = new URLSearchParams(window.location.search);
        return q.get("txn_id") || q.get("TXNID");
      } catch {
        return null;
      }
    })();

  useEffect(() => {
    if (!txnId) {
      setError("Missing transaction ID");
      setLoading(false);
      return;
    }
    paymentApi
      .validatePayment({ txn_id: txnId })
      .then((data) => {
        setPayment(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { error?: string; payment?: PaymentTransaction } } };
        const msg = ax?.response?.data?.error || "Validation failed";
        setError(msg);
        if (ax?.response?.data?.payment) {
          setPayment(ax.response.data.payment);
        }
      })
      .finally(() => setLoading(false));
  }, [txnId]);

  const { user } = useAuth();
  const returnTo = searchParams.get("return_to") || "";
  const role = resolveAppRole(user);
  const basePath = role === "driver" ? "/app/driver" : role === "ticket_dealer" ? "/app/ticket-dealer" : "/app/user";
  const homePath = getHomePathForUser(user);
  const goWallet = () => navigate(`${basePath}/wallet`);
  const goCard = () => navigate(`${basePath}/card`);
  const goBooking = () => navigate(`${basePath}/booking?tab=my-booking`);
  const goDeposit = () => navigate(`${basePath}/deposit`);
  const goPayDue = () => navigate(`${basePath}/pay-due`);

  const handleBack = () => {
    if (loading) {
      navigate(homePath);
      return;
    }
    navigate(homePath, {
      state: {
        paymentCallback: {
          success: !error && !!payment,
          payment: payment ?? null,
          error: error ?? null,
          txnId: txnId ?? null,
          returnTo,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Payment" showBack onBack={handleBack} />
      <div className="px-5 pt-6 pb-24">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="text-base font-semibold">Validating payment...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 border-l-4 border-l-rose-500 bg-white dark:bg-card/80 p-6 text-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-9 w-9 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            {payment && (
              <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-4 inline-block">
                Ref: {payment.reference_id} · Rs. {payment.amount}
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {returnTo === "pay_due" ? (
                <Button onClick={goPayDue} className="rounded-xl h-11">Try again</Button>
              ) : (
                <Button onClick={goDeposit} className="rounded-xl h-11">Try again</Button>
              )}
              <Button variant="outline" onClick={goWallet} className="rounded-xl h-11">My Wallet</Button>
            </div>
          </div>
        )}

        {!loading && !error && payment && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-500 bg-white dark:bg-card/80 p-6 text-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-9 w-9 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <div className="bg-muted rounded-xl px-4 py-3 mb-4 text-left space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rs. {Number(payment.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Reference</span>
                <span className="text-xs font-medium">{payment.reference_id}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={goWallet} className="rounded-xl h-11">My Wallet</Button>
              {(returnTo === "pay_due" || payment.purpose === "pay_due") && (
                <Button variant="outline" onClick={goPayDue} className="rounded-xl h-11">Pay Due</Button>
              )}
              {(returnTo === "card_topup" || payment.purpose === "card_topup") && (
                <Button variant="outline" onClick={goCard} className="rounded-xl h-11">My Card</Button>
              )}
              {(returnTo === "booking" || payment.purpose === "vehicle_ticket_booking") && (
                <Button variant="outline" onClick={goBooking} className="rounded-xl h-11">My Booking</Button>
              )}
            </div>
          </div>
        )}

        {!loading && !txnId && (
          <div className="rounded-2xl bg-white dark:bg-card/80 border border-border/50 p-6 text-center shadow-sm">
            <p className="text-muted-foreground mb-4">No transaction ID found.</p>
            <Button onClick={goWallet} className="rounded-xl h-11">My Wallet</Button>
          </div>
        )}
      </div>
    </div>
  );
}
