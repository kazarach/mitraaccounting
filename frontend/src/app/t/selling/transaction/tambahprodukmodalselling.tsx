"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  Row,
} from "@tanstack/react-table";
import { toast } from "sonner";
import useSWR from "swr";
import { cn, fetcher } from "@/lib/utils";
import Loading from "@/components/loading";
import { DistributorDropdown } from "@/components/dropdown-checkbox/distributor-dropdown";
import { CategoryDropdown } from "@/components/dropdown-checkbox/category-dropdown";
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TambahProdukModalProps {
  tableName: string;
}

const TambahProdukModalSelling: React.FC<TambahProdukModalProps> = ({ tableName }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [distributor, setDistributor] = useState<number[]>([]);
  const supplierParam = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";
  // const category = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";

  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data, error, isLoading, mutate } = useSWR(`${API_URL}api/stock/?transaction_type=SALE${supplierParam}`, fetcher);

  const handleAddProduct = (product: any) => {
    const defaultPrice = product.prices?.find((p: any) => p.is_default) || product.prices?.[0];
  
    const newItem = {
      stock: product.id,
      barcode: product.barcode,
      stock_code: product.code,
      stock_name: product.name,
      jumlah_pesanan: product.jumlah_barang,
      quantity: product.jumlah_barang,
      stock_price_buy: parseFloat(product.price_buy),
      stock_price_sell: defaultPrice ? parseFloat(defaultPrice.price_sell) : 0,
      unit: product.unit_name
    };
  
    toast.success(product.name + " Berhasil Ditambahkan");
    dispatch(addRow({ tableName, row: newItem }));
  };
    

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <div
            className="flex items-center gap-2 cursor-pointer w-96"
            onClick={() =>
              setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
            }
          >
            Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
          </div>
        ),
      },

      { accessorKey: "available_quantity", header: "Jumlah Stok" },
      {
        accessorKey: "price_buy",
        header: "Harga Beli",
        cell: (info: any) => `Rp ${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        header: "Harga Jual 1",
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === 1);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },
      {
        header: "Harga Jual 2",
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === 2);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },
      {
        header: "Harga Jual 3",
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === 3);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },      
      {
        header: "Harga Jual 4",
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === 4);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },      
      {
        header: "Harga Jual 5",
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === 5);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },      
      {
        accessorKey: "last_buy",
        header: "Last Buy",
        cell: ({ getValue }) => {
          const rawValue = getValue();
          if (!rawValue || typeof rawValue !== 'string') return "-";
          const parsedDate = new Date(rawValue);
          if (isNaN(parsedDate.getTime())) return "-";
          return format(parsedDate, "d/M/yyyy", { locale: id });
        },
      },
      {
        accessorKey: "last_sell",
        header: "Last Sell",
        cell: ({ getValue }) => {
          const rawValue = getValue();
          if (!rawValue || typeof rawValue !== 'string') return "-";
          const parsedDate = new Date(rawValue);
          if (isNaN(parsedDate.getTime())) return "-";
          return format(parsedDate, "d/M/yyyy", { locale: id });
        },
      },
      
      {
        accessorKey: "Action",
        header: "Action",
        cell: ({ row }: { row: Row<any> }) => {
          const product = row.original;
          const [_, forceUpdate] = useState(0); // Pakai ini kalau mau trigger render ulang
const quantity = Number(product.jumlah_barang) || 0;

      
const updateQuantity = (val: number | string) => {
  const parsed = Number(val);
  const value = isNaN(parsed) ? 0 : Math.max(0, parsed);
  row.original.jumlah_barang = value;
  forceUpdate((n) => n + 1); // Paksa render ulang supaya input ikut berubah
};
            
      
const increment = () => {
  row.original.jumlah_barang = (row.original.jumlah_barang || 0) + 1;
  forceUpdate(n => n + 1); // trigger re-render
};

const decrement = () => {
  row.original.jumlah_barang = Math.max(0, (row.original.jumlah_barang || 0) - 1);
  forceUpdate(n => n + 1); // trigger re-render
};
       
          
          
      
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded">
                <button
                  onClick={decrement}
                  className="px-2 bg-red-200 rounded-l hover:bg-red-300"
                >
                  -
                </button>
                <input
                    type="number"
                    value={quantity === 0 ? "" : quantity}
                    onChange={(e) => {
                        const parsed = parseInt(e.target.value.replace(/^0+(?=\d)/, "") || "0");
                        updateQuantity(parsed);
                    }}
                    placeholder="0"
                    className="w-12 text-center outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    min={0}
                    />
                <button
                  onClick={increment}
                  className="px-2 bg-blue-200 rounded-r hover:bg-blue-300"
                >
                  +
                </button>
              </div>
              <Button
                onClick={() => handleAddProduct(row.original)}
                className="bg-blue-500 hover:bg-blue-600 size-6"
                disabled={!quantity || Number(quantity) <= 0}
                >
                <Plus />
                </Button>
            </div>
          );
        },
        enableSorting: false,
      }
      
    ],
    [sorting]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Produk</DialogTitle>
      </DialogHeader>


      <div>
        <div className="flex justify-between">
          <div className=" flex">
            <div className="my-2 relative w-56">
              <DistributorDropdown onChange={(ids) => setDistributor(ids)} />
            </div>
            <div className="my-2 relative w-56">
              <CategoryDropdown />
            </div>
          </div>
          <div className="my-2 relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Cari"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] max-w-screen overflow-x-auto overflow-y-auto">
        <div className="w-[90vw] text-sm border-separate border-spacing-0 min-w-full">
            <Table className=" bg-white">
              <TableHeader className="bg-gray-100 sticky top-0 z-10" >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={cn(
                        "text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100",
                        header.id === "barcode" && "w-[120px]",
                        header.id === "name" && "w-[200px]",
                        header.id === "jumlah" && "w-[120px]",
                        header.id === "action" &&
                        "sticky right-0 z-30 bg-gray-100 w-[50px]"
                      )}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      <Loading />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-red-500">

                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow key={row.id} className="bg-white">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "text-left truncate w-[85px] p-2 border-b border-r first:border-l last:border-r",rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100',
                            cell.column.id === "barcode" && "w-[120px]",
                            cell.column.id === "name" && "w-[200px]",
                            cell.column.id === "jumlah" && "w-[120px]",
                            cell.column.id === "action" &&
                            "sticky right-0 z-20 bg-white w-[50px]"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-gray-400">
                      Tidak ada produk ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

            </Table>
        </div>
        <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>

    </div>
  );
};

export default TambahProdukModalSelling;
