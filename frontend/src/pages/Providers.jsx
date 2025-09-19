import React from "react";
import ThemeProvider from "./ThemeProvider";
import { Toaster } from "sonner";

const Providers = ({ children }) => {
  return (
    <>
      <ThemeProvider
        attribute={"class"}
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </>
  );
};

export default Providers;
