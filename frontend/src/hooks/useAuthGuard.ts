"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const useAuthGuard = () => {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

    if (!token) {
      router.push("/login");
    }
  }, []);
};

export default useAuthGuard;