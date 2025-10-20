import React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { links } from "@/utils/links";
import {
  SignedOut,
  SignedIn,
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/clerk-react";
import { href, Link } from "react-router-dom";
import { Button } from "../ui/button";
import { LuAlignLeft } from "react-icons/lu";
import UserIcon from "@/components/navbar/UserIcon";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import SignOutLink from "./SignOutLink";
import { useNavigate } from "react-router-dom";

const LinkDropdown = () => {
  const { orgRole } = useAuth();

  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} className="flex gap-4 max-w-[100px]">
          <LuAlignLeft className="w-6 h-6"></LuAlignLeft>

          <UserIcon></UserIcon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="center" sideOffset={10}>
        <SignedOut>
          <DropdownMenuItem>
            <button
              className="w-full text-left"
              onClick={() => {
                navigate("/login");
              }}
            >
              login
            </button>
          </DropdownMenuItem>

          <DropdownMenuSeparator></DropdownMenuSeparator>
          <DropdownMenuItem>
            <SignUpButton mode="modal">
              <button className="w-full text-left">Register</button>
            </SignUpButton>
          </DropdownMenuItem>
        </SignedOut>
        <SignedIn>
          <DropdownMenuSeparator></DropdownMenuSeparator>
          <DropdownMenuItem>
            <SignOutLink></SignOutLink>
          </DropdownMenuItem>
        </SignedIn>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LinkDropdown;
