import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { testRouter } from "./routers/client/Test.router";
import { ClerkProvider } from "@clerk/clerk-react";
import HomeLayout, { homeLayoutLoader } from "./layout/home-layout/HomeLayout";
import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import { ThemeProvider } from "./components/global/ThemeProvider";
import Booking from "./pages/customer/Booking";
import BookingProgress from "./pages/customer/BookingProgress";
import AdminLayout from "./layout/admin-layout/AdminLayout";
import Manager from "./pages/manager/Manager";
import ManagerItems from "./pages/manager/Items";
import AddItem from "./pages/manager/AddItem";
import About from "./pages/AboutUs";
import ItemListPage from "./pages/ItemListPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import NotFoundPage from "./pages/404";
import { partsPageLoader, partFormLoader } from "./utils/loaders";
import StaffLayout from "./layout/staff-layout/StaffLayout";
import Staff from "./pages/staff/Staff";

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
      {
        path: "/items",
        element: <ItemListPage />,
      },
      {
        path: "/items/1",
        element: <ItemDetailPage />,
      },

      // 404 within HomeLayout
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
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
    ],
  },

  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      { index: true, element: <Staff /> },
      {
        path: "items",
        element: <ManagerItems />,
        loader: partsPageLoader,
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
