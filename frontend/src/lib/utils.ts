import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetcher = (url: string) => {
  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (access) headers["Authorization"] = `Bearer ${access}`;
  if (refresh) headers["x-refresh-token"] = refresh;

  return fetch(url, { headers }).then((res) => res.json());
};
