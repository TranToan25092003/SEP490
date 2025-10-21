import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider, GoogleOneTap } from "@clerk/clerk-react";
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
import BookingDetail from "./pages/staff/BookingDetail";
import BookingList from "./pages/staff/BookingList";
import AdminLayout from "./layout/admin-layout/AdminLayout";
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
import { partsPageLoader, 
  partFormLoader, 
  partsClientLoader, 
  partLoaderByClient, 
  goodsReceiptListLoader, 
  partsStaffLoader, 
  partDetailStaffLoader} from "./utils/loaders";
import StaffLayout from "./layout/staff-layout/StaffLayout";
import Staff from "./pages/staff/Staff";
import StaffItemsPage from "./pages/staff/StaffItemsPage";
import StaffItemDetail from "./pages/staff/StaffItemDetail";
import StaffComplaintsPage from "./pages/staff/StaffComplaintsPage";
import StaffComplaintDetail from "./pages/staff/StaffComplaintDetail";

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

      // 404 within HomeLayout
      {
        path: "*",
        element: <NotFoundPage />,
      },
      {
        path: "/items",
        element: <ItemListPage />,
      },
      {
        path: "/items/1",
        element: <ItemDetailPage />,
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
    children: [
      { index: true, element: <Manager /> },
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
    ],
  },
  {
    path: "/staff",
    element: <AdminLayout />,
    children: [
      { path: "booking/:id", element: <BookingDetail /> },
      { path: "booking/", element: <BookingList /> },
    ],
  },

  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      { index: true, element: <Staff /> },
      {
        path: "items",
        element: <StaffItemsPage />,
        loader: partsStaffLoader,
      },
      {
        path: "items/:id",
        element: <StaffItemDetail />,
        loader: partDetailStaffLoader
      },
      {
        path: "complaints",
        element: <StaffComplaintsPage />,
      },
      {
        path: "complaints/:id",
        element: <StaffComplaintDetail />,
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
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <Toaster></Toaster>
        <RouterProvider router={router} />
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
