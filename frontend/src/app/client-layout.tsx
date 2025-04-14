"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app-header";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { usePathname } from "next/navigation";  // Import usePathname

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();  // Mendapatkan path saat ini

  // Cek apakah halaman saat ini adalah /login
  const isLoginPage = pathname === "/login";

  return (
    <SidebarProvider>
      {/* Jika bukan halaman login, tampilkan sidebar dan header */}
      {!isLoginPage && <AppSidebar />}
      
      <main className="flex flex-1 flex-col">
        {/* Jika bukan halaman login, tampilkan header */}
        {!isLoginPage && <Header />}
        
        <Provider store={store}>
          {children}
        </Provider>
      </main>

      {/* Selalu tampilkan toaster */}
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
