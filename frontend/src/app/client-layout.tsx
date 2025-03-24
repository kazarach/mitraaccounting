"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app-header";
import { Provider } from "react-redux";
import { store } from "@/store/store";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <Header />
        <Provider store={store}>
          {children}
        </Provider>
      </main>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
