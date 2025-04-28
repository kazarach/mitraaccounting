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
import Loading from "../loading";
import { DistributorDropdown } from "../dropdown-checkbox/distributor-dropdown";

interface TambahProdukModalProps {
  tableName: string;
}

const TambahProdukModal: React.FC<TambahProdukModalProps> = ({ tableName }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [distributor, setDistributor] = useState<number[]>([]);
  const supplierParam = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";
  // const category = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";

  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data, error, isLoading, mutate } = useSWR(`${API_URL}api/stock/?include_sales=true${supplierParam}`, fetcher);

  const handleAddProduct = (product: any) => {
    const newItem = {
      barcode: product.barcode,
      stock_code: product.code,
      stock_name: product.name,
      jumlah_pesanan: "-",
      quantity: product.jumlah_barang ?? 1,
      stock_price_buy: product.price_buy,
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
      { accessorKey: "barcode", header: "Barcode" },
      { accessorKey: "available_quantity", header: "Jumlah Stok" },
      { accessorKey: "purchase_quantity_week", header: "Terbeli (7H)" },
      { accessorKey: "purchase_quantity_month", header: "Terbeli (30H)" },
      { accessorKey: "sales_quantity_week", header: "Terjual (7H)" },
      { accessorKey: "sales_quantity_month", header: "Terjual (30H)" },
      {
        accessorKey: "price_buy",
        header: "Harga Beli",
        cell: (info: any) => `Rp${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        accessorKey: "jumlahInput",
        header: "Jumlah",
        cell: ({ row }: { row: Row<any> }) => {
          const product = row.original;
          const [quantity, setQuantity] = useState(product.jumlah_barang || 1);

          const updateQuantity = (val: number) => {
            const value = Math.max(1, val);
            setQuantity(value);
            row.original.jumlah_barang = value;
          };

          const increment = () => updateQuantity(quantity + 1);
          const decrement = () => updateQuantity(quantity - 1);

          return (
            <div className="flex items-center">
              <button
                onClick={decrement}
                className="px-1 bg-red-200 rounded-l hover:bg-red-300"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-10 text-center border"
                min={1}
              />
              <button
                onClick={increment}
                className="px-1 bg-blue-200 rounded-r hover:bg-blue-300"
              >
                +
              </button>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: { row: Row<any> }) => (
          <Button onClick={() => handleAddProduct(row.original)} className="bg-blue-500 hover:bg-blue-600 size-7">
            <Plus />
          </Button>
        ),
        enableSorting: false,
      },
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
          <div>
            <div className="my-2 relative w-64">
              <DistributorDropdown onChange={(ids) => setDistributor(ids)} />
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

        <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[68vh] bg-white relative">
          <Table className="w-full min-w-[1000px] bg-white table-fixed">
            <TableHeader className="sticky top-0 bg-gray-100 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn(
                      "text-left truncate w-[90px]",
                      header.id === "barcode" && "w-[120px]",
                      header.id === "name" && "w-[320px]",
                      header.id === "jumlah" && "w-[120px]",
                      header.id === "action" && "w-[50px]",
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="bg-white">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "text-left truncate w-[90px]",
                          cell.column.id === "barcode" && "w-[120px]",
                          cell.column.id === "name" && "w-[320px]",
                          cell.column.id === "jumlah" && "w-[120px]",
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
      </div>

    </div>
  );
};

export default TambahProdukModal;
