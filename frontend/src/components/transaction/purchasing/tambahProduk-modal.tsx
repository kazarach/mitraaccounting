"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { products } from "@/data/product";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TambahProdukModal = () => {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() =>
              setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
            }
          >
            Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
          </div>
        ),
      },
      { accessorKey: "barcode", header: "Barcode" },
      { accessorKey: "quantityOutput", header: "Jumlah Stok" },
      { accessorKey: "boughtLast7Days", header: "Terbeli (7H)" },
      { accessorKey: "soldLast7Days", header: "Terjual (7H)" },
      { accessorKey: "boughtLast30Days", header: "Terbeli (30H)" },
      { accessorKey: "soldLast30Days", header: "Terjual (30H)" },
      {
        accessorKey: "purchasePrice",
        header: "Harga Beli",
        cell: (info : any) => `Rp${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        accessorKey: "price",
        header: "Harga Retail",
        cell: (info) => `Rp${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        accessorKey: "price2",
        header: "Harga Grosir",
        cell: (info) => `Rp${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: () => (
          <Button className="bg-blue-500 hover:bg-blue-600 size-7">
            <Plus />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [sorting]
  );

  const table = useReactTable({
    data: products,
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

      {/* Input Search */}
      <div className="my-2 relative w-1/4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Cari Produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      {/* Tabel dengan Scroll Horizontal dan Sticky Action Column */}
      <div className="rounded-md border overflow-x-auto overflow-y-auto max-h-[60vh] bg-white relative">
        <Table className="w-full min-w-[1000px] bg-white">
          <TableHeader className="sticky top-0 bg-gray-100 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-left ${header.column.id === "action" ? "sticky right-0 bg-gray-100 z-10" : ""}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-white">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`text-left ${cell.column.id === "action" ? "sticky right-0 bg-white z-10" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TambahProdukModal;