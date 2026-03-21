import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function MonitoringLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
