import { Outlet } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";
import BottomNav, { userNavItems } from "@/components/app/BottomNav";

export default function UserLayout() {
  return (
    <AppLayout>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav items={userNavItems} />
    </AppLayout>
  );
}
