import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWalkieTalkie } from "@/contexts/WalkieTalkieContext";
import AppLayout from "@/components/app/AppLayout";
import BottomNav from "@/components/app/BottomNav";
import {
  getAppRoleConfig,
  getDefaultPathForRole,
  resolveAppRole,
  APP_NAV_ICON_MAP,
  type AppRoleId,
} from "@/config/appRoles";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import type { PaymentTransaction } from "@/types/payment";

interface AppRoleLayoutProps {
  role: AppRoleId;
}

interface PaymentCallbackState {
  success: boolean;
  payment: PaymentTransaction | null;
  error: string | null;
  txnId: string | null;
  returnTo?: string;
}

export default function AppRoleLayout({ role }: AppRoleLayoutProps) {
  const { user } = useAuth();
  const { groups } = useWalkieTalkie();
  const navigate = useNavigate();
  const location = useLocation();
  const config = getAppRoleConfig(role);
  const paymentCallback = location.state?.paymentCallback as PaymentCallbackState | undefined;
  const basePath = config.basePath;

  const userAppRole = resolveAppRole(user);
  const isWrongRole = userAppRole !== null && userAppRole !== role;
  const canUseWalkieTalkie = !!user?.is_driver || groups.length > 0;
  const visibleNavItems = config.navItems.filter(
    (item) => item.path !== "walkietalkie" || canUseWalkieTalkie
  );

  useEffect(() => {
    if (isWrongRole && userAppRole) {
      navigate(getDefaultPathForRole(userAppRole), { replace: true });
    }
  }, [isWrongRole, userAppRole, navigate]);

  const navItems = visibleNavItems.map((item) => {
    const Icon = APP_NAV_ICON_MAP[item.icon];
    const path = `${config.basePath}/${item.path}`.replace(/\/+/g, "/");
    return {
      label: item.label,
      path,
      icon: Icon ? <Icon size={20} /> : null,
    };
  });

  if (isWrongRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  const closePaymentModal = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <AppLayout>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav items={navItems} />

      <Dialog open={!!paymentCallback} onOpenChange={(open) => !open && closePaymentModal()}>
        <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border shadow-xl">
          {paymentCallback && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  {paymentCallback.success ? "Payment successful" : "Payment failed"}
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-2">
                {paymentCallback.success && paymentCallback.payment ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Amount: Rs. {Number(paymentCallback.payment.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Ref: {paymentCallback.payment.reference_id}
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {paymentCallback.error ?? "Something went wrong"}
                    </p>
                    {paymentCallback.payment && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Ref: {paymentCallback.payment.reference_id} · Rs. {paymentCallback.payment.amount}
                      </p>
                    )}
                  </>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={closePaymentModal}>
                    Close
                  </Button>
                  <Button size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/wallet`); }}>
                    My Wallet
                  </Button>
                  {!paymentCallback.success && (
                    <>
                      {paymentCallback.returnTo === "pay_due" && (
                        <Button variant="secondary" size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/pay-due`); }}>
                          Try again (Pay Due)
                        </Button>
                      )}
                      {paymentCallback.returnTo !== "pay_due" && (
                        <Button variant="secondary" size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/deposit`); }}>
                          Try again (Deposit)
                        </Button>
                      )}
                    </>
                  )}
                  {paymentCallback.success && paymentCallback.payment && (
                    <>
                      {(paymentCallback.returnTo === "pay_due" || paymentCallback.payment.purpose === "pay_due") && (
                        <Button variant="secondary" size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/pay-due`); }}>
                          Pay Due
                        </Button>
                      )}
                      {(paymentCallback.returnTo === "card_topup" || paymentCallback.payment.purpose === "card_topup") && (
                        <Button variant="secondary" size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/card`); }}>
                          My Card
                        </Button>
                      )}
                      {(paymentCallback.returnTo === "booking" || paymentCallback.payment.purpose === "vehicle_ticket_booking") && (
                        <Button variant="secondary" size="sm" onClick={() => { closePaymentModal(); navigate(`${basePath}/booking?tab=my-booking`); }}>
                          My Booking
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
