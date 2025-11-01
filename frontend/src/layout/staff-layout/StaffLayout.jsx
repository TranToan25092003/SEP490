import { Outlet } from "react-router-dom";

import TopMenu from "../admin-layout/TopMenu";
import StaffSideBar from "./StaffSideBar";

export default function StaffLayout() {
  const HEADER_HEIGHT = 80;
  const SIDEBAR_WIDTH = 130;
  return (
    <div className="relative min-h-screen font-inter bg-white">
      <StaffSideBar width={SIDEBAR_WIDTH} offsetTop={HEADER_HEIGHT} />
      <TopMenu height={HEADER_HEIGHT} sidebarWidth={SIDEBAR_WIDTH} />
      <div
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingLeft: `${SIDEBAR_WIDTH}px`,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
