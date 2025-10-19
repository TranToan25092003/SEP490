import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import HomeLayout, { homeLayoutLoader } from "./layout/home-layout/HomeLayout";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import { ThemeProvider } from "./components/global/ThemeProvider";
import Booking from "./pages/customer/Booking";
import BookingProgress from "./pages/customer/BookingProgress";
import BookingDetail from "./pages/staff/BookingDetail";
import BookingList from "./pages/staff/BookingList";
import AdminLayout from "./layout/admin-layout/AdminLayout";
import Manager from "./pages/manager/Manager";
import ManagerItems from "./pages/manager/Items";
import About from "./pages/AboutUs";
import ItemListPage from "./pages/ItemListPage";
import ItemDetailPage from "./pages/ItemDetailPage";

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
        element: <Booking />
      },
      {
        path: "/booking/:id",
        element: <BookingProgress />
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
      
    ],
  },
  {
    path: "/manager",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Manager /> },
      { path: "items", element: <ManagerItems /> },
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
