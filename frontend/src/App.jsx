import { useEffect } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { ClerkProvider, GoogleOneTap, SignedIn } from "@clerk/clerk-react";
// import { testRouter } from "./routers/client/Test.router";
import HomeLayout, { homeLayoutLoader } from "./layout/home-layout/HomeLayout";
// import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
// import { Button } from "antd";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RoleRedirect from "./pages/auth/RoleRedirect";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Home from "./pages/Home";
import { ThemeProvider } from "./components/global/ThemeProvider";
import Booking from "./pages/customer/Booking";
import BookingProgress from "./pages/customer/BookingProgress";
import BookingQuotes from "./pages/customer/BookingQuotes";
import BookingHistoryDetail from "./pages/customer/BookingHistoryDetail";
import BookingTracking from "./pages/customer/BookingTracking";
import WarrantyBooking from "./pages/customer/WarrantyBooking";
import ServiceOrderDetail from "./pages/staff/ServiceOrderDetail";
import ServiceOrderDetailQuotes from "./pages/staff/ServiceOrderDetailQuotes";
import ServiceOrderDetailProgress from "./pages/staff/ServiceOrderDetailProgress";
import ServiceOrderList from "./pages/staff/ServiceOrderList";
import ServiceOrderAdd from "./pages/staff/ServiceOrderAdd";
import BookingDetail from "./pages/staff/BookingDetail";
import BookingList from "./pages/staff/BookingList";
import NiceModal from "@ebay/nice-modal-react";
import ChatStaff from "./pages/staff/ChatStaff";
import ManagerLayout from "./layout/manager-layout/ManagerLayout";
import Manager from "./pages/manager/Manager";
import ManagerItems from "./pages/manager/Items";
import AddItem from "./pages/manager/AddItem";
import CreateGoodsReceipt from "./pages/manager/CreateGoodsReceipt";
import GoodsReceiptList from "./pages/manager/GoodsReceiptList";
import GoodsReceiptDetail from "./pages/manager/GoodsReceiptDetail";
import About from "./pages/AboutUs";
import ItemListPage from "./pages/ItemListPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import NotFoundPage from "./pages/404";
import {
  partsPageLoader,
  partFormLoader,
  homeLoader,
  partsClientLoader,
  partLoaderByClient,
  goodsReceiptListLoader,
  partsStaffLoader,
  partDetailStaffLoader,
  complaintsStaffLoader,
  complaintDetailStaffLoader,
  notificationsPageLoader,
  adminServicesLoader,
  adminModelsLoader,
  adminBannersLoader,
  staffDashboardLoader,
} from "./utils/loaders";
import StaffLayout from "./layout/staff-layout/StaffLayout";
import { viVN } from "@clerk/localizations";
import Staff from "./pages/staff/Staff";
import LayoutProfile, {
  layoutProfileLoader,
} from "./pages/profile/LayoutProfile";
import StaffItemsPage from "./pages/staff/StaffItemsPage";
import StaffItemDetail from "./pages/staff/StaffItemDetail";
import StaffComplaintsPage from "./pages/staff/StaffComplaintsPage";
import StaffComplaintDetail from "./pages/staff/StaffComplaintDetail";
import ComplaintCategoryManager from "./pages/staff/ComplaintCategoryManager";
import CreateComplaint from "./pages/customer/CreateComplaint";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import ManagerBays from "./pages/manager/ManagerBays";
import StaffInvoicesPage from "./pages/staff/StaffInvoicesPage";
import StaffInvoiceDetail from "./pages/staff/StaffInvoiceDetail";
import StaffPage from "./pages/manager/Staff";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import { adminActivityLogsLoader } from "./utils/loaders";
import GlobalLoginLogger from "./components/global/GlobalLoginLogger";
import NotificationListPage from "./pages/NotificationListPage";
import AttendanceTracking from "./pages/manager/AttendanceTracking";
import AdminLayout from "./layout/admin-layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminModelsPage from "./pages/admin/AdminModelsPage";
import AdminBannersPage from "./pages/admin/AdminBannersPage";
import CustomerInvoices from "./pages/customer/CustomerInvoices";
import CustomerInvoiceDetail from "./pages/customer/CustomerInvoiceDetail";
import LoyaltyWallet from "./pages/customer/LoyaltyWallet";
import LoyaltyProgram from "./pages/manager/LoyaltyProgram";
import StaffBayStatusPage from "./pages/staff/BayStatus";
import {
  authenTicationLoader,
  authenTicationForStaffLoader,
  authenTicationForAdminLoader,
  authenTicationForManagerLoader,
} from "./utils/authentication.loader";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const appRoutes = [
  {
    path: "/",
    element: <HomeLayout />,
    loader: homeLayoutLoader,
    children: [
      {
        path: "/",
        element: <Home />,
        loader: homeLoader,
      },
      {
        path: "/booking",
        loader: Booking.loader,
        element: <Booking />,
      },
      {
        path: "/booking-tracking",
        element: <BookingTracking />,
        loader: BookingTracking.loader,
      },
      {
        path: "/booking/:id",
        element: <BookingProgress />,
        loader: BookingProgress.loader,
      },
      {
        path: "/booking/:id/quotes",
        element: <BookingQuotes />,
        loader: BookingQuotes.loader,
      },
      {
        path: "/booking/:id/history",
        element: <BookingHistoryDetail />,
        loader: BookingHistoryDetail.loader,
      },
      {
        path: "/warranty-booking",
        element: <WarrantyBooking />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/loyalty",
        element: <LoyaltyWallet />,
      },
      {
        path: "/items",
        element: <ItemListPage />,
        loader: partsClientLoader,
      },
      {
        path: "/items/:id",
        element: <ItemDetailPage />,
        loader: partLoaderByClient,
      },
      {
        path: "/complaint",
        element: <CreateComplaint />,
      },
      {
        path: "/invoices",
        element: <CustomerInvoices />,
        loader: CustomerInvoices.loader,
      },
      {
        path: "/invoices/:id",
        element: <CustomerInvoiceDetail />,
        loader: CustomerInvoiceDetail.loader,
      },

      // 404 within HomeLayout
      {
        path: "*",
        element: <NotFoundPage />,
      },
      {
        path: "/profile",
        loader: layoutProfileLoader,

        element: <LayoutProfile></LayoutProfile>,
      },
      {
        path: "/notifications",
        loader: notificationsPageLoader,
        element: <NotificationListPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/sso-callback",
    element: (
      <AuthenticateWithRedirectCallback></AuthenticateWithRedirectCallback>
    ),
  },
  {
    path: "/auth/role-redirect",
    element: <RoleRedirect />,
  },
  {
    path: "/manager",
    element: <ManagerLayout />,
    loader: authenTicationForManagerLoader,
    children: [
      { index: true, element: <Manager />, loader: Manager.loader },
      { path: "staff", element: <StaffPage /> },
      {
        path: "items",
        element: <ManagerItems />,
        loader: partsPageLoader,
      },
      {
        path: "items/add",
        element: <AddItem />,
        loader: partFormLoader,
      },
      {
        path: "goods-receipt",
        element: <CreateGoodsReceipt />,
      },
      {
        path: "goods-receipt-list",
        element: <GoodsReceiptList />,
        loader: goodsReceiptListLoader,
      },
      {
        path: "goods-receipt/:id",
        element: <GoodsReceiptDetail />,
      },
      {
        path: "bays",
        element: <ManagerBays />,
      },
      {
        path: "attendance-tracking",
        element: <AttendanceTracking />,
      },
      {
        path: "loyalty",
        element: <LoyaltyProgram />,
      },
    ],
  },

  {
    path: "/staff",
    element: <StaffLayout />,
    loader: authenTicationForStaffLoader,
    children: [
      {
        index: true,
        element: <StaffDashboardPage />,
        loader: staffDashboardLoader,
      },
      {
        path: "service-order/:id",
        element: <ServiceOrderDetail />,
        loader: ServiceOrderDetail.loader,
      },
      {
        path: "service-order/:id/quotes",
        element: <ServiceOrderDetailQuotes />,
        loader: ServiceOrderDetailQuotes.loader,
      },
      {
        path: "service-order/:id/progress",
        element: <ServiceOrderDetailProgress />,
        loader: ServiceOrderDetailProgress.loader,
      },
      {
        path: "service-order/",
        element: <ServiceOrderList />,
        loader: ServiceOrderList.loader,
      },
      {
        path: "service-order/add",
        element: <ServiceOrderAdd />,
        loader: ServiceOrderAdd.loader,
      },
      {
        path: "booking/:id",
        element: <BookingDetail />,
        loader: BookingDetail.loader,
      },
      {
        path: "booking/",
        element: <BookingList />,
        loader: BookingList.loader,
      },
      {
        path: "items",
        element: <StaffItemsPage />,
        loader: partsStaffLoader,
      },
      {
        path: "bay-status",
        element: <StaffBayStatusPage />,
      },
      {
        path: "items/:id",
        element: <StaffItemDetail />,
        loader: partDetailStaffLoader,
      },
      {
        path: "complaints",
        element: <StaffComplaintsPage />,
        loader: complaintsStaffLoader,
      },
      {
        path: "complaints/:id",
        element: <StaffComplaintDetail />,
        loader: complaintDetailStaffLoader,
      },
      {
        path: "complaints/categories",
        element: <ComplaintCategoryManager />,
      },
      {
        path: "invoices",
        element: <StaffInvoicesPage />,
      },
      {
        path: "invoices/:id",
        element: <StaffInvoiceDetail />,
      },
      {
        path: "chat",
        element: <ChatStaff />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    loader: authenTicationForAdminLoader,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: "services",
        element: <AdminServicesPage />,
        loader: adminServicesLoader,
      },
      {
        path: "models",
        element: <AdminModelsPage />,
        loader: adminModelsLoader,
      },
      {
        path: "banners",
        element: <AdminBannersPage />,
        loader: adminBannersLoader,
      },
      {
        path: "activity-logs",
        element: <AdminActivityLogs />,
        loader: adminActivityLogsLoader,
      },
    ],
  },
];

const router = createBrowserRouter([
  {
    element: <AppRouteLayout />,
    children: appRoutes,
  },
]);

function AppRouteLayout() {
  const location = useLocation();

  useEffect(() => {
    const root = document.getElementById("root") || document.scrollingElement;
    if (root && typeof root.scrollTo === "function") {
      root.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else if (root) {
      root.scrollTop = 0;
      root.scrollLeft = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return <Outlet />;
}

function App() {
  if (!PUBLISHABLE_KEY) {
    return <h1>Server was closed. See you around</h1>;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="motormate-theme">
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        localization={viVN}
      >
        <NiceModal.Provider>
          <Toaster></Toaster>
          <GlobalLoginLogger />
          <SpeedInsights />
          <Analytics />
          <RouterProvider router={router} />
        </NiceModal.Provider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
