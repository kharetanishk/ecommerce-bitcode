"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cart.store";
import { useLocationDetect } from "@/hooks/useLocationDetect";
import { useLocationStore } from "@/store/location.store";

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const openCart = useCartStore((s) => s.openCart);
  const getCount = useCartStore((s) => s.getCount);
  const count = getCount();
  const [menuOpen, setMenuOpen] = useState(false);

  useLocationDetect();
  const { city, detectedBy } = useLocationStore();

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-semibold text-gray-900">BitCode</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Products
          </Link>
          {user && (
            <Link
              href="/orders"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Admin
            </Link>
          )}
          {/* Location indicator */}
          {city && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {city}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={openCart}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-xs font-medium rounded-full flex items-center justify-center">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {(user.name ?? user.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {user.name ?? user.email}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
