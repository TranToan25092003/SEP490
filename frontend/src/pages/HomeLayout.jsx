import React from "react";
import Providers from "./Providers";
import Navbar from "@/components/navbar/Navbar";
import Header from "@/components/global/Header";
import Container from "@/components/global/Container";
import { Outlet, useNavigation } from "react-router-dom";
import Loading from "@/components/global/Loading";
import { Toaster } from "sonner";
import Footer from "@/components/global/Footer";

import { useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";

export const homeLayoutLoader = async () => {
  try {
    return {};
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return { categories: [] };
  }
};

const HomeLayout = () => {
  const { setActive } = useClerk();

  useEffect(() => {
    setActive({
      organization: "org_32tzUd7dUcFW7Te5gxEO4VcgkX1",
    });
  }, []);

  const { state } = useNavigation();

  return (
    <>
      <Toaster position="bottom-right" richColors expand closeButton />
      <div className={` antialiased`}>
        <Providers>
          <Header />
          <Container className={"mt-4"}>
            {state === "loading" ? (
              <>
                <Loading></Loading>
              </>
            ) : (
              <Outlet></Outlet>
            )}
          </Container>
          <Footer />
        </Providers>
      </div>
    </>
  );
};

export default HomeLayout;
