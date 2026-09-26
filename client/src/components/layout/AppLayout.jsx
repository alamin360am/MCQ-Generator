import { Outlet } from "react-router-dom";

import DesktopSidebar from "../navigation/DesktopSidebar";
import MobileBottomNav from "../navigation/MobileBottomNav";
import Topbar from "../navigation/Topbar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <DesktopSidebar />

      <div className="lg:pl-72">
        <Topbar />

        <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-7 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

export default AppLayout;
