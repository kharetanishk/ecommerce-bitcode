"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useCartSync } from "@/hooks/useCart";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Toaster } from "@/components/ui/Toaster";
// Inner component has access to session + query context
function AppShell({ children }: { children: React.ReactNode }) {
  useCartSync(); // syncs local cart with server on login
  return (
    <>
      {children}
      <CartDrawer />
      <Toaster />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell>{children}</AppShell>
      </QueryClientProvider>
    </SessionProvider>
  );
}
