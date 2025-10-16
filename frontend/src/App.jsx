import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { testRouter } from "./routers/client/Test.router";
import { ClerkProvider, GoogleOneTap } from "@clerk/clerk-react";
import HomeLayout, { homeLayoutLoader } from "./pages/HomeLayout";
import ErrorPage from "./components/global/Error";
import { Toaster } from "sonner";
import { Button } from "antd";
import Login from "./pages/auth/Login";

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
        path: "/history",
        lazy: async () => {
          const { default: HistoryRepair } = await import(
            "./pages/history-repair/HistoryRepair"
          );
          return { Component: HistoryRepair };
        },
        errorElement: <ErrorPage></ErrorPage>,
      },
    ],
  },

  {
    path: "/login",
    element: <Login></Login>,
  },

  testRouter,
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
