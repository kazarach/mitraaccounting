"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  FileArchive,
  ShoppingCart,
  ChevronDown,
  FileChartColumn,
  House,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Pindahkan data menu ke atas
const Menus = [
  {
    title: "Transaksi",
    icon: ShoppingCart,
    subItems: [
      {
        title: "Pembelian",
        subItems: [
          { title: "Transaksi Pembelian", url: "/t/purchasing/transaction" },
          { title: "Pesanan Pembelian", url: "/t/purchasing/order" },
          { title: "Retur Pembelian", url: "/t/purchasing/return" },
        ],
      },
      {
        title: "Penjualan",
        subItems: [
          { title: "Transaksi Penjualan", url: "/t/selling/transaction" },
          { title: "Pesanan Penjualan", url: "/t/selling/order" },
          { title: "Retur Penjualan", url: "/t/selling/return" },
          { title: "Tukar Poin", url: "/t/selling/point" },
        ],
      },
      {
        title: "Persediaan",
        subItems: [
          { title: "Opname Persediaan", url: "/t/stock/opname" },
          { title: "Pemakaian Persediaan", url: "/t/stock/use" },
        ],
      },
      { title: "Mutasi", url: "#" },
      { title: "Kas/Bank", url: "#" },
      { title: "Open Drawer", url: "#" },
    ],
  },
  {
    title: "Laporan",
    icon: FileChartColumn,
    subItems: [
      {
        title: "Persediaan",
        subItems: [
          { title: "Fast Moving", url: "/l/stock/fastmoving" },
          { title: "Stok per Jenis", url: "/l/stock/stocktype" },
          { title: "Nilai Stok Persediaan", url: "/l/stock/stockvalue" },
          { title: "Opname Persediaan", url: "/l/stock/opname" },
        ],
      },
      { title: "Pantauan Stock dan Pesanan Penjualan", url: "/l/monitoring" },
      { title: "Pembelian", url: "/l/purchasing" },
      { title: "Penjualan", url: "/l/selling" },
      { title: "Penjualan per Barang", url: "/l/selling-items" },
      { title: "Laba Rugi", url: "/l/profitloss" },
      { title: "Hutang", url: "/l/hutang" },
      { title: "Piutang", url: "/l/piutang" },
      { title: "Kas / Bank", url: "/l/kasbank" },
      { title: "Pendapatan Jasa", url: "#" },
      { title: "Kasir", url: "/l/kasir" },
      { title: "Poin Member", url: "/l/poinmember" },
    ],
  },
  {
    title: "Arsip",
    icon: FileArchive,
    subItems: [
      { title: "Pesanan Pembelian", url: "/a/purchaseorder" },
      { title: "Pembelian", url: "/a/purchase" },
      { title: "Retur Pembelian", url: "/a/purchasereturn" },
      { title: "Pesanan Penjualan", url: "/a/sellingorder" },
      { title: "Penjualan", url: "/a/selling" },
      { title: "Retur Penjualan", url: "#" },
      { title: "Pemakaian Persediaan", url: "#" },
      { title: "Mutasi", url: "#" },
      { title: "Kas / Bank", url: "#" },
      { title: "Open Drawer", url: "#" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [openMainMenus, setOpenMainMenus] = useState<string | null>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Buka menu sesuai path saat load
  useEffect(() => {
    Menus.forEach((menu) => {
      const found = menu.subItems.find((sub) => {
        if (sub.subItems) {
          return sub.subItems.some((item) => item.url === pathname);
        }
        return sub.url === pathname;
      });

      if (found) {
        setOpenMainMenus(menu.title);
        if (found.subItems) {
          setOpenSubMenus((prev) => ({
            ...prev,
            [found.title]: true,
          }));
        }
      }
    });
  }, [pathname]);

  const toggleMainMenu = (title: string) => {
    setOpenMainMenus((prev) => (prev === title ? null : title));
  };

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <Sidebar className="bg-slate-800 h-screen">
      <SidebarHeader>
        <div className="flex items-center p-3 gap-1 bg-slate-800 justify-center">
          <img src="/vercel.svg" alt="Logo" className="w-6 h-6" />
          <h1 className="font-bold text-sm text-center text-white">
            Mitra Accounting
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="scroll-container h-screen overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
            
            <SidebarMenuButton className="flex items-center gap-2 w-full p-2 rounded-sm hover:bg-slate-700 transition hover:text-white">
                <a href="/" className="flex items-center gap-2 w-full text-white">
                  <House size={18} className="text-white" />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>

              {Menus.map((menu) => (
                <div key={menu.title} className="group">
                  <Collapsible
                    open={openMainMenus === menu.title}
                    onOpenChange={() => toggleMainMenu(menu.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center justify-between w-full p-2 rounded-sm hover:bg-slate-700 transition">
                        <div className="flex items-center gap-2">
                          <menu.icon size={18} className="text-white" />
                          <span className="text-white">{menu.title}</span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-white transition-transform duration-200 ${
                            openMainMenus === menu.title ? "rotate-180" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="ml-4 border-l-2 border-gray-600 pl-3">
                        {menu.subItems.map((subItem) =>
                          subItem.subItems ? (
                            <Collapsible
                              key={subItem.title}
                              open={openSubMenus[subItem.title] || false}
                              onOpenChange={() => toggleSubMenu(subItem.title)}
                            >
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="flex items-center justify-between w-full px-2 py-1.5 rounded-sm hover:bg-slate-700 transition">
                                  <span className="text-white">{subItem.title}</span>
                                  <ChevronDown
                                    size={14}
                                    className={`text-white transition-transform duration-200 ${
                                      openSubMenus[subItem.title] ? "rotate-180" : ""
                                    }`}
                                  />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-4 border-l-2 border-gray-500 pl-3">
                                  {subItem.subItems.map((nestedSub) => (
                                    <div key={nestedSub.title} className="hover:bg-slate-700 transition rounded-sm">
                                      <a
                                        href={nestedSub.url}
                                        className={`flex items-center px-2 py-1.5 text-white ${
                                          pathname === nestedSub.url ? "bg-slate-700 font-semibold" : ""
                                        }`}
                                      >
                                        <span>{nestedSub.title}</span>
                                      </a>

                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <div key={subItem.title} className="hover:bg-slate-700 transition rounded-sm">
                              <a
  href={subItem.url}
  className={`flex items-center px-2 py-1.5 text-white ${
    pathname === subItem.url ? "bg-slate-700 font-semibold" : ""
  }`}
>
  <span>{subItem.title}</span>
</a>

                            </div>
                          )
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    <SidebarFooter>
    <Popover>
      <PopoverTrigger asChild>
        <Button className="bg-white text-slate-800 hover:bg-slate-800 hover:text-white hover:border-white hover:border">Admin</Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-center">Admin</h4>
            <p className="text-sm text-center text-muted-foreground">
              Welcome to MitraAccounting.
            </p>
          </div>
          <div className="grid gap-2">
            <Button>
              <a href="#">Admin Page</a>
            </Button>
            <Button className="bg-white text-red-500 border border-red-500 hover:bg-red-500 hover:text-white">
              <a href="/login">Logout</a>
            </Button>          
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </SidebarFooter>
    </Sidebar>
  );
}
function setOpenMainMenus(title: string) {
  throw new Error("Function not implemented.");
}

function setOpenSubMenus(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.");
}

