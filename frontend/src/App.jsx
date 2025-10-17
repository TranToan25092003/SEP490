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
    ],
  },

  testRouter,
  {
    path: "/manager",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Manager /> },
      { path: "items", element: <ManagerItems /> },
      { path: "items/add", element: <AddItem /> },
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
