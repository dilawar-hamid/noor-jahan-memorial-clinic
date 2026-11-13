import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StorageAlert from "../components/StorageAlert";
import NetworkStatus from "../components/NetworkStatus";

function ReceptionLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [, setClockTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setMobileSidebarOpen((open) => !open);
    } else {
      setSidebarCollapsed((collapsed) => !collapsed);
    }
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        mobileSidebarOpen={mobileSidebarOpen}
        onNavigate={closeMobileSidebar}
      />

      {mobileSidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="main-area">
        <Topbar onMenuClick={toggleSidebar} />
        <NetworkStatus />
        <StorageAlert />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ReceptionLayout;
