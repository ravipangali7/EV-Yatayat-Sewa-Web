import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Lock, Wallet, Car, MapPin, LogOut, ChevronRight, Camera, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@/components/app/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const menuItems = [
    { icon: Edit, label: "Edit Profile", onClick: () => setShowEditModal(true) },
    { icon: Lock, label: "Change Password", onClick: () => setShowPasswordModal(true) },
    { icon: Wallet, label: "Wallet", to: "/app/driver/wallet" },
    { icon: Car, label: "Vehicle", to: "/app/driver/vehicle" },
    { icon: MapPin, label: "Map", onClick: () => toast.info("Map feature coming soon") },
  ];

  const handleLogout = () => {
    logout();
    navigate("/app/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <AppBar title="Profile" />
      <div className="px-5 pt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8">
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
      </motion.div>

      <div className="space-y-1">
        {menuItems.map((item) => {
          const content = (
            <div className="flex items-center gap-3 p-3.5 app-glass-card rounded-xl border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <item.icon size={16} className="text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          );
          if ("to" in item && item.to) {
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
            <Input type="password" placeholder="Current Password" className="h-11 rounded-xl" />
            <Input type="password" placeholder="New Password" className="h-11 rounded-xl" />
            <Input type="password" placeholder="Confirm Password" className="h-11 rounded-xl" />
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
