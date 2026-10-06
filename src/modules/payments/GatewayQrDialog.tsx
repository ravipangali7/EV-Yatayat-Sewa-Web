import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { paymentApi } from "@/modules/payments/services/paymentApi";

export interface GatewayQrSession {
  qr_string: string;
  payment_id: number | string;
  reference_id: string;
  amount: string;
}

export function GatewayQrDialog({
  session,
  onClose,
  onPaid,
}: {
  session: GatewayQrSession | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const paidRef = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    paidRef.current = false;
    if (!session?.payment_id) return;
    let stopped = false;

    const poll = async () => {
      if (stopped || paidRef.current) return;
      try {
        const tx = await paymentApi.getPaymentTransactionById(String(session.payment_id), true);
        if (stopped || paidRef.current) return;
        if (tx.status === "success") {
          paidRef.current = true;
          onPaidRef.current();
        }
      } catch {
        // Keep polling. NCHL may not have posted yet.
      }
    };

    const timer = window.setInterval(poll, 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [session]);

  return (
    <Dialog open={!!session} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan to pay</DialogTitle>
          <DialogDescription>
            Pay Rs. {session?.amount} with any NepalPay app. This QR expires in about 15 minutes.
          </DialogDescription>
        </DialogHeader>
        {session?.qr_string ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={session.qr_string} size={220} includeMargin={false} />
            </div>
            <p className="text-xs text-muted-foreground">Bill {session.reference_id}</p>
            <p className="text-sm text-muted-foreground">Waiting for payment...</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
