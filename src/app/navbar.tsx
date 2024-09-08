"use client";
import { useEffect, useState } from "react";
import { Menu, X, DollarSign, ReceiptIndianRupeeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const [isApp, setIsApp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    async function isLoggedIn() {
      const session = await supabase.auth.getUser();
      if (session.data.user) {
        setIsApp(true);
      }
    }
    isLoggedIn();
  }, []);

  return (
    <nav className="bg-white shadow-lg ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <ReceiptIndianRupeeIcon className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-800">
                Kharach
              </span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8 justify-center items-center">
            <Button variant={"ghost"}>
              <Link href={isApp ? "/dashboard" : "/#features"} className="">
                {isApp ? "Dashboard" : "Features"}
              </Link>
            </Button>

            {isApp && (
              <Button
                variant={"destructive"}
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                Logout
              </Button>
            )}
            {!isApp && (
              <Button>
                <Link href="/signin">Sign in</Link>
              </Button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button onClick={() => setIsOpen(!isOpen)} className="">
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href={isApp ? "/dashboard" : "/#features"}
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {isApp ? "Dashboard" : "Features"}
            </Link>
            <Link
              href={isApp ? "/expenses" : "/#pricing"}
              className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {isApp ? "Expenses" : "Pricing"}
            </Link>
            {!isApp && (
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
