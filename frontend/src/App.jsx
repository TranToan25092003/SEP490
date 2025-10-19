import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { testRouter } from "./routers/client/Test.router";
import { ClerkProvider, GoogleOneTap } from "@clerk/clerk-react";
import HomeLayout, { homeLayoutLoader } from "./layout/home-layout/HomeLayout";
import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
import { Button } from "antd";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import { ThemeProvider } from "./components/global/ThemeProvider";
import Booking from "./pages/customer/Booking";
import BookingProgress from "./pages/customer/BookingProgress";
import AdminLayout from "./layout/admin-layout/AdminLayout";
import Manager from "./pages/manager/Manager";
import ManagerItems from "./pages/manager/Items";
import AddItem from "./pages/manager/AddItem";
import GoodsReceipt from "./pages/manager/GoodsReceipt";
import About from "./pages/AboutUs";
import NotFoundPage from "./pages/404";
import { partsPageLoader, partFormLoader } from "./utils/loaders";
import ItemListPage from "./pages/ItemListPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

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

  testRouter,
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
        element: <GoodsReceipt />,
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
