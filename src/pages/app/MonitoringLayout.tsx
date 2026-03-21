import { Outlet } from 'react-router-dom';

/**
 * Full-screen monitoring routes (no dashboard sidebar/header).
 * Vehicle + camera monitoring each fill the viewport with their own back bar.
 */
export default function MonitoringLayout() {
  return <Outlet />;
}
