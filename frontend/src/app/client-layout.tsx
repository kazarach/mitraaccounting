"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app-header";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { usePathname } from "next/navigation";  

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <Provider store={store}>
      <SidebarProvider>
        {!isLoginPage && <AppSidebar />}
        <main className="flex flex-1 flex-col">
          {!isLoginPage && <Header />}
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </Provider>
  );
}
