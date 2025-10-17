import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { testRouter } from "./routers/client/Test.router";
import { ClerkProvider } from "@clerk/clerk-react";
import HomeLayout, { homeLayoutLoader } from "./pages/HomeLayout";
import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import AdminLayout from "./components/Layout/adminLayout";
import Manager from "./pages/manager/Manager";
import ManagerItems from "./pages/manager/Items";
import AddItem from "./pages/manager/AddItem";

// IMPORT COMPONENT VÀ LOADER MỚI CHO THỐNG KÊ
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    errorElement: <ErrorPage />,
    loader: homeLayoutLoader,
    children: [
      {
        path: "/",
        element: <Home />,
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Toaster></Toaster>

      <RouterProvider router={router} />
    </ClerkProvider>
  );
}

export default App;
