import { Outlet } from "react-router-dom";
import { useState } from "react";

import TopMenu from "../admin-layout/TopMenu";
import StaffSideBar from "./StaffSideBar";

export default function StaffLayout() {
  const HEADER_HEIGHT = 80;
  const SIDEBAR_WIDTH = 100;
  const SIDEBAR_EXPANDED_WIDTH = 250;
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  return (
    <div className="relative min-h-screen font-inter bg-white">
      <StaffSideBar
        width={SIDEBAR_WIDTH}
        expandedWidth={SIDEBAR_EXPANDED_WIDTH}
        offsetTop={HEADER_HEIGHT}
        expanded={isSidebarExpanded}
        onExpandToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <TopMenu
        sidebarWidth={isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH}
        height={HEADER_HEIGHT}
      />
      <div
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingLeft: `${isSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH}px`,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
