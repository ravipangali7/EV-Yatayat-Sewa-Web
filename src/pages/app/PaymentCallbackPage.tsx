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
    <div className="min-h-screen">
      <AppBar title="Payment" showBack onBack={handleBack} />
      <div className="px-5 pt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating payment...</p>
          </div>
        )}

        {!loading && error && (
          <div className="app-surface rounded-2xl p-6 border border-border text-center">
            <XCircle className="h-14 w-14 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Payment failed</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {payment && (
              <p className="text-xs text-muted-foreground mb-4">
                Ref: {payment.reference_id} · Rs. {payment.amount}
              </p>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {returnTo === "pay_due" && (
                <Button variant="outline" onClick={goPayDue}>
                  Try again (Pay Due)
                </Button>
              )}
              {returnTo !== "pay_due" && (
                <Button variant="outline" onClick={goDeposit}>
                  Try again (Deposit)
                </Button>
              )}
              <Button onClick={goWallet}>My Wallet</Button>
            </div>
          </div>
        )}

        {!loading && !error && payment && (
          <div className="app-surface rounded-2xl p-6 border border-border text-center">
            <CheckCircle className="h-14 w-14 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-2">Payment successful</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Amount: Rs. {Number(payment.amount).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Ref: {payment.reference_id}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={goWallet}>My Wallet</Button>
              {(returnTo === "pay_due" || payment.purpose === "pay_due") && (
                <Button variant="outline" onClick={goPayDue}>
                  Back to Pay Due
                </Button>
              )}
              {(returnTo === "card_topup" || payment.purpose === "card_topup") && (
                <Button variant="outline" onClick={goCard}>
                  My Card
                </Button>
              )}
              {(returnTo === "booking" || payment.purpose === "vehicle_ticket_booking") && (
                <Button variant="outline" onClick={goBooking}>
                  My Booking
                </Button>
              )}
            </div>
          </div>
        )}

        {!loading && !txnId && (
          <div className="app-surface rounded-2xl p-6 border border-border text-center">
            <p className="text-muted-foreground mb-4">No transaction ID in URL.</p>
            <Button onClick={goWallet}>My Wallet</Button>
          </div>
        )}
      </div>
    </div>
  );
}
