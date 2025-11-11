import React from "react";
import Header from "@/components/global/Header";
import Container from "@/components/global/Container";
import { Outlet, useNavigation } from "react-router-dom";
import Loading from "@/components/global/Loading";
import Footer from "@/components/global/Footer";
import FloatingChatButton from "@/components/global/FloatingChatButton";

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
  const { setActive, isSignedIn, user } = useClerk();

  useEffect(() => {
    if (isSignedIn) {
      console.log(user.id);
      setActive({
        organization: "org_32tzUd7dUcFW7Te5gxEO4VcgkX1",
      });
    }
  }, [isSignedIn]);

  const { state } = useNavigation();

  return (
    <>
      <div className={`flex flex-col min-h-screen font-poppins`}>
        <Header />
        <div className={"flex-1"}>
          {state === "loading" ? (
            <>
              <Loading></Loading>
            </>
          ) : (
            <Outlet></Outlet>
          )}
        </div>
        <Footer />
        <FloatingChatButton />
      </div>
    </>
  );
};

export default HomeLayout;
