import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import TopMenu from "../manager-layout/TopMenu";

export default function AdminLayout() {
  const HEADER_HEIGHT = 80;
  const SIDEBAR_WIDTH = 100;
  const SIDEBAR_EXPANDED_WIDTH = 250;
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  return (
    <div className="relative min-h-screen font-inter bg-white">
      <AdminSidebar
        width={SIDEBAR_WIDTH}
        expandedWidth={SIDEBAR_EXPANDED_WIDTH}
        offsetTop={HEADER_HEIGHT}
        expanded={isSidebarExpanded}
        onExpandToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <TopMenu
        sidebarWidth={
          isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH
        }
        height={HEADER_HEIGHT}
      />
      <div
        className="transition-all duration-300" 
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingLeft: `${
            isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH
          }px`,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}