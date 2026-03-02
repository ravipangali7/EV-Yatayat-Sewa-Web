import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Wallet, CreditCard, CalendarDays, LogOut, ChevronRight, Camera, Edit, Receipt, TrendingUp, PlusCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AppBar from "@/components/app/AppBar";

const menuItemDefs = [
  { icon: Edit, label: "Edit Profile", iconClass: "icon-violet", onClick: "edit" },
  { icon: Lock, label: "Change Password", iconClass: "icon-amber", onClick: "password" },
  { icon: PlusCircle, label: "Deposit", iconClass: "icon-emerald", to: "/app/ticket-dealer/deposit" },
  { icon: Wallet, label: "Wallet", iconClass: "icon-blue", to: "/app/ticket-dealer/wallet" },
  { icon: Send, label: "Transfer", iconClass: "icon-cyan", to: "/app/ticket-dealer/wallet" },
  { icon: CreditCard, label: "Topup Card", iconClass: "icon-rose", to: "/app/ticket-dealer/card/topup" },
  { icon: CreditCard, label: "Card", iconClass: "icon-indigo", to: "/app/ticket-dealer/card" },
  { icon: CalendarDays, label: "My Bookings", iconClass: "icon-orange", to: "/app/ticket-dealer/booking" },
  { icon: TrendingUp, label: "Revenue", iconClass: "icon-primary", to: "/app/ticket-dealer/revenue" },
  { icon: Receipt, label: "Transactions", iconClass: "icon-muted", to: "/app/ticket-dealer/transactions" },
];

export default function DealerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/app/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppBar title="Profile" />
      <div className="px-5 pt-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-md p-6 flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <User size={32} className="text-primary-foreground" />
              </div>
              <button type="button" className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-sm">
                <Camera size={12} className="text-primary-foreground" />
              </button>
            </div>
            <h2 className="font-bold text-lg">{user?.name ?? (name || "Dealer")}</h2>
            <p className="text-sm text-muted-foreground">{user?.phone ?? phone}</p>
            <span className="mt-2 text-[11px] px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">Ticket Dealer</span>
          </div>
        </motion.div>

        <div className="space-y-2">
          {menuItemDefs.map((item) => {
            const content = (
              <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconClass}`}>
                  <item.icon size={16} />
                </div>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            );
            if (item.to) {
              return <Link key={item.label} to={item.to}>{content}</Link>;
            }
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => item.onClick === "edit" ? setShowEditModal(true) : setShowPasswordModal(true)}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full mt-6 h-12 rounded-xl text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
        >
          <LogOut size={16} className="mr-2" /> Logout
        </Button>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="max-w-[340px] rounded-2xl">
            <DialogHeader><DialogTitle>Logout</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to logout?</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleLogout}>Logout</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-[380px] rounded-2xl">
            <DialogHeader><DialogTitle className="text-base">Edit Profile</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 rounded-xl" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-11 rounded-xl" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11 rounded-xl" />
              <Button className="w-full h-11 rounded-xl" onClick={() => { setShowEditModal(false); toast.success("Profile updated!"); }}>Save</Button>
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
              <Button className="w-full h-11 rounded-xl" onClick={() => { setShowPasswordModal(false); toast.success("Password changed!"); }}>Update</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
