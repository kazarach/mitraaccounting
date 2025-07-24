"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  FileArchive,
  ShoppingCart,
  ChevronDown,
  FileChartColumn,
  House,
  EllipsisVertical,
  LogOut,
  PersonStanding,
  ShieldEllipsis,
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
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarImage } from "./ui/avatar";

const handleLogout = async () => {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout error", err);
  }

  // Redirect setelah logout
  window.location.href = "/";
};
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
      // { title: "Mutasi", url: "#" },
      { title: "Kas/Bank", url: "/t/kasbank" },
      // { title: "Open Drawer", url: "#" },
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
        ],
      },
      { title: "Pantauan Stock dan Pesanan", url: "/l/monitoring" },
      { title: "Pembelian", url: "/l/purchasing" },
      { title: "Penjualan", url: "/l/selling" },
      { title: "Penjualan per Barang", url: "/l/selling-items" },
      { title: "Laba Rugi", url: "/l/profitloss" },
      { title: "Hutang", url: "/l/hutang" },
      { title: "Piutang", url: "/l/piutang" },
      { title: "Kas / Bank", url: "/l/kasbank" },
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
      { title: "Retur Penjualan", url: "/a/sellingreturn" },
      { title: "Opname Persediaan", url: "/a/opname" },
      { title: "Pemakaian Persediaan", url: "/a/usestock" },
      // { title: "Mutasi", url: "/a/mutation" },
      { title: "Kas / Bank", url: "/a/kasbank" },
      { title: "Open Drawer", url: "/a/drawer" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openMainMenus, setOpenMainMenus] = useState<string | null>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const { data = [], error, isLoading } = useSWR(`/api/proxy/api/users/me/`, fetcher)

  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

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
                          className={`text-white transition-transform duration-200 ${openMainMenus === menu.title ? "rotate-180" : ""
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
                                    className={`text-white transition-transform duration-200 ${openSubMenus[subItem.title] ? "rotate-180" : ""
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
                                        className={`flex items-center px-2 py-1.5 text-white ${pathname === nestedSub.url ? "bg-slate-700 rounded-sm font-semibold" : ""
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
                                className={`flex items-center px-2 py-1.5 text-white ${pathname === subItem.url ? "bg-slate-700 rounded-sm font-semibold" : ""
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
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <SidebarMenuButton size="lg">
                <span className="text-sm text-muted-foreground">Loading user...</span>
              </SidebarMenuButton>
            ) : error ? (
              <SidebarMenuButton size="lg">
                <span className="text-sm text-red-500">Error loading user</span>
              </SidebarMenuButton>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className=" text-white hover:text-white hover:bg-slate-700"
                  >
                    <Avatar className="h-8 w-8 rounded-lg grayscale bg-slate-200">
                      <img src="https://www.shutterstock.com/image-vector/vector-male-face-avatar-logo-600nw-426321556.jpg" alt="" />
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {data?.username}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {data?.role?.name}
                      </span>
                    </div>
                    <EllipsisVertical className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg grayscale bg-slate-200">
                        <img src="https://www.shutterstock.com/image-vector/vector-male-face-avatar-logo-600nw-426321556.jpg" alt="" />
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {data?.username}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {data?.role?.name}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <ShieldEllipsis />
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
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

