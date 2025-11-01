import {
  sidebarLogo as imgLogo,
  iconHome as imgHome,
  iconEmail as imgEmail,
  iconContacts as imgContactBook,
  iconCrypto as imgCoin,
  iconKanban as imgDashboard,
  iconInvoice as imgInvoice,
  iconBanking as imgMoney,
  iconTickets as imgTicket,
  iconStaff as imgStaff,
} from "@/assets/admin/sidebar_new";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router-dom";

const items = [
  { key: "home", label: "Dashboard", icon: imgHome, href: "/manager" },
  {
    key: "parts",
    label: "Quản lý phụ tùng",
    icon: imgMoney,
    href: "/manager/items",
  },
  {
    key: "goodReceipts",
    label: "Quản lý phiếu nhập kho",
    icon: imgInvoice,
    href: "/manager/goods-receipt-list",
  },
  { key: "coin", label: "Chat CSKH", icon: imgContactBook },
  { key: "kanban", label: "Kanban", icon: imgDashboard },
  { key: "invoice", label: "Invoice", icon: imgCoin },
  { key: "bank", label: "Banking", icon: imgEmail },
  { key: "ticket", label: "Tickets", icon: imgTicket },
  { key: "staff", label: "Staff", icon: imgStaff, href: "/manager/staff" },
];

export default function Sidebar({ width = 80, offsetTop = 100 }) {
  const location = useLocation();
  return (
    <aside
      className="fixed left-0 z-40 border-r"
      style={{ top: 0, width, bottom: 0 }}
    >
      <div className="flex flex-col items-center">
        <img alt="" src={imgLogo} className="w-[43px] h-[43px] mt-4 mb-2" />
        <TooltipProvider>
          <nav
            className="flex flex-col items-center gap-3.5"
            style={{ marginTop: Math.max(0, offsetTop - 54) }}
          >
            {items.map((it) => (
              <Tooltip key={it.key}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl size-11 shadow-sm"
                    asChild={Boolean(it.href)}
                  >
                    {it.href ? (
                      <Link
                        to={it.href}
                        aria-current={
                          location.pathname === it.href ? "page" : undefined
                        }
                      >
                        <img alt="" src={it.icon} className="size-7" />
                      </Link>
                    ) : (
                      <img alt="" src={it.icon} className="size-7" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{it.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>
      </div>
    </aside>
  );
}
