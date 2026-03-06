import { Outlet } from "react-router-dom";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">
      <PublicHeader />
      <main className="flex-1 w-full max-w-full min-w-0">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
