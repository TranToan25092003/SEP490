import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  ClerkProvider,
  GoogleOneTap,
  SignedIn,
  useUser,
} from "@clerk/clerk-react";
// import { testRouter } from "./routers/client/Test.router";
import HomeLayout, { homeLayoutLoader } from "./layout/home-layout/HomeLayout";
// import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
// import { Button } from "antd";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import { ThemeProvider } from "./components/global/ThemeProvider";
import Booking from "./pages/customer/Booking";
import BookingProgress from "./pages/customer/BookingProgress";
import ServiceOrderDetail from "./pages/staff/ServiceOrderDetail";
import ServiceOrderDetailQuotes from "./pages/staff/ServiceOrderDetailQuotes";
import ServiceOrderDetailProgress from "./pages/staff/ServiceOrderDetailProgress";
import ServiceOrderList from "./pages/staff/ServiceOrderList";
import ServiceOrderAdd from "./pages/staff/ServiceOrderAdd";
import BookingDetail from "./pages/staff/BookingDetail";
import BookingList from "./pages/staff/BookingList";
import NiceModal from "@ebay/nice-modal-react";
import ChatStaff from "./pages/staff/ChatStaff";
import AdminLayout from "./layout/manager-layout/ManagerLayout";
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
  partsClientLoader,
  partLoaderByClient,
  goodsReceiptListLoader,
  partsStaffLoader,
  partDetailStaffLoader,
  complaintsStaffLoader,
  complaintDetailStaffLoader,
  notificationsPageLoader,
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
import CreateComplaint from "./pages/customer/CreateComplaint";
import StaffDashboardPage from "./pages/staff/StaffDashboardPage";
import ManagerBays from "./pages/manager/ManagerBays";
import {
  authenTicationForStaffLoader,
  authenTicationLoader,
} from "./utils/authentication.loader";
import StaffPage from "./pages/manager/Staff";
import ActivityLogs from "./pages/manager/ActivityLogs";
import { activityLogsLoader } from "./utils/loaders";
import GlobalLoginLogger from "./components/global/GlobalLoginLogger";
import NotificationListPage from "./pages/NotificationListPage";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    loader: homeLayoutLoader,
    children: [
      {
        path: "/",
        element: <Home />,
        loader: partsClientLoader,
      },
      {
        path: "/booking",
        loader: Booking.loader,
        element: <Booking />,
      },
      {
        path: "/booking/:id",
        element: <BookingProgress />,
      },
      {
        path: "/about",
        element: <About />,
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
    path: "/sso-callback",
    element: (
      <AuthenticateWithRedirectCallback></AuthenticateWithRedirectCallback>
    ),
  },
  {
    path: "/manager",
    element: <AdminLayout />,
    loader: authenTicationLoader,
    children: [
      { index: true, element: <Manager /> },
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
        path: "activity-logs",
        element: <ActivityLogs />,
        loader: activityLogsLoader,
      },
      {
        path: "activity-logs",
        element: <ActivityLogs />,
        loader: activityLogsLoader,
      },
    ],
  },

  {
    path: "/staff",
    element: <StaffLayout />,
    loader: authenTicationForStaffLoader,
    children: [
      { index: true, element: <StaffDashboardPage /> },
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
      { path: "service-order/add", element: <ServiceOrderAdd /> },
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
        path: "chat",
        element: <ChatStaff />,
      },
    ],
  },
]);

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
          <RouterProvider router={router} />
        </NiceModal.Provider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
