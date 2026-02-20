import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Lock, Wallet, LogOut, ChevronRight, Camera, Edit, CreditCard, Send, Clock, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { walletApi } from "@/modules/wallets/services/walletApi";
import { toNumber } from "@/lib/utils";

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toPay, setToPay] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const refreshToPay = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await walletApi.list({ user: user.id, per_page: 1 });
      const wallet = res.results[0];
      setToPay(wallet ? toNumber(wallet.to_pay, 0) : 0);
    } catch {
      setToPay(0);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshToPay();
  }, [refreshToPay]);

  const menuItems: { icon: typeof Edit; label: string; to?: string; onClick?: () => void }[] = [
    { icon: Edit, label: "Edit Profile", onClick: () => setShowEditModal(true) },
    { icon: Lock, label: "Change Password", onClick: () => setShowPasswordModal(true) },
    { icon: CreditCard, label: "Deposit", to: "/app/driver/wallet" },
    { icon: Wallet, label: "Wallet", to: "/app/driver/wallet" },
    { icon: Send, label: "Transfer", to: "/app/driver/wallet" },
    { icon: Clock, label: "Trip History", to: "/app/driver/trip-history" },
    { icon: FileText, label: "Seat Booking", to: "/app/driver/seat-booking" },
    { icon: Receipt, label: "Transactions", to: "/app/driver/wallet" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/app/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Profile" />
      <div className="px-5 pt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="profile-blur-card flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
              <User size={36} className="text-primary-foreground" />
            </div>
            <button type="button" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Camera size={12} className="text-primary-foreground" />
            </button>
          </div>
          <h2 className="font-bold text-lg">{user?.name ?? (name || "Driver")}</h2>
          <p className="text-sm text-muted-foreground">{user?.phone ?? phone}</p>
          <span className="mt-1 text-[10px] px-3 py-1 rounded-full bg-accent text-accent-foreground font-medium">Driver</span>
          {toPay > 0 && (
            <Link to="/app/driver/pay-due" className="mt-4 w-full app-glass-card rounded-xl p-3 border border-border/50 flex items-center justify-between">
              <span className="text-sm font-medium">Pay due</span>
              <span className="text-sm font-bold text-primary">Rs. {toPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </Link>
          )}
        </div>
      </motion.div>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const content = (
            <div className="flex items-center gap-3 p-3.5 app-glass-card rounded-xl border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <item.icon size={16} className="text-accent-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          );
          if (item.to) {
            return <Link key={item.label} to={item.to}>{content}</Link>;
          }
          return (
            <button key={item.label} type="button" onClick={item.onClick} className="w-full text-left">
              {content}
            </button>
          );
        })}
      </div>

      <Button variant="outline" onClick={handleLogout} className="w-full mt-6 h-12 rounded-xl text-destructive border-destructive/30">
        <LogOut size={16} className="mr-2" /> Logout
      </Button>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-base">Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 rounded-xl" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-11 rounded-xl" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 rounded-xl" />
            <Button className="w-full h-11 rounded-xl" onClick={() => { setShowEditModal(false); toast.success("Profile updated!"); }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-base">Change Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <PasswordInput placeholder="Current Password" className="h-11 rounded-xl" />
            <PasswordInput placeholder="New Password" className="h-11 rounded-xl" />
            <PasswordInput placeholder="Confirm Password" className="h-11 rounded-xl" />
            <Button className="w-full h-11 rounded-xl" onClick={() => { setShowPasswordModal(false); toast.success("Password changed!"); }}>
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
