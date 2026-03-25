"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCartSync } from "@/hooks/useCart";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Toaster } from "@/components/ui/Toaster";
import { getMeApi } from "@/lib/authApi";
import { useAuthStore } from "@/store/auth.store";

function AppShell({ children }: { children: React.ReactNode }) {
  useCartSync();
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

  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { user } = await getMeApi();
        if (cancelled) return;
        setAuth(user, null);
      } catch {
        if (cancelled) return;
        clearAuth();
      } finally {
        if (cancelled) return;
        setAuthChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  if (!authChecked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
    </QueryClientProvider>
  );
}
