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

export const fetcherpost = async (
  url: string,
  { arg }: { arg: any & { _method?: 'POST' | 'PUT' } }
) => {
  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (access) headers["Authorization"] = `Bearer ${access}`;
  if (refresh) headers["x-refresh-token"] = refresh;

  const method = arg._method || 'POST';
  const payload = { ...arg };
  delete payload._method; // remove _method before sending to backend

  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Gagal melakukan transaksi');
  }

  return res.json();
};
