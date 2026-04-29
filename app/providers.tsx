"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { fetcher } from "@/lib/api/fetcher";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        {children}
        <Toaster />
      </SWRConfig>
    </SessionProvider>
  );
}
