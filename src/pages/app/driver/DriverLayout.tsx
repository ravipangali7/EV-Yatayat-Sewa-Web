import { Outlet } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";
import BottomNav, { driverNavItems } from "@/components/app/BottomNav";

export default function DriverLayout() {
  return (
    <AppLayout>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav items={driverNavItems} />
    </AppLayout>
  );
}
