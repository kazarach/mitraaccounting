"use client";
import { createContext, useContext, useState, useEffect } from "react";
import useSWR from "swr";
import { usePathname, useRouter } from "next/navigation";

type AuthContextType = {
  user: any;
  mutate: ReturnType<typeof useSWR>["mutate"];
  loading: boolean;
};
const AuthContext = createContext<AuthContextType | null>(null);

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" }); // penting
  if (!res.ok) {
    const err: any = new Error("Fetch failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { data: user, error, isLoading, mutate } = useSWR(
    "/api/proxy/api/users/me/",
    fetcher,
    { shouldRetryOnError: false }
  );

  useEffect(() => {
    if (error?.status === 401 && pathname !== "/login") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [error, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, mutate, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
