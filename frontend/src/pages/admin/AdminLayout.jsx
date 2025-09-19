import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { adminLinks } from "@/utils/links";
import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const DashboardLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="mb-20">
      <h2 className="text-2xl pl-4">Dashboard</h2>
      <Separator></Separator>
      <section className="grid lg:grid-cols-12 gap-12 mt-12">
        <div className="lg:col-span-2">
          <aside>
            {adminLinks.map(({ href, label }) => {
              const activePage = pathname === href;

              const variant = activePage ? "default" : "ghost";

              return (
                <Button
                  asChild
                  key={href}
                  className={"w-full mb-2 capitalize font-normal"}
                  variant={variant}
                >
                  <Link to={href}> {label} </Link>
                </Button>
              );
            })}
          </aside>
        </div>

        <div className="lg:col-span-10 px-4">
          <Outlet></Outlet>
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
