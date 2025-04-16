"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  Row,
  ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import useSWR from "swr";

interface TambahProdukModalProps {
  tableName: string;
}

const fetcher = (url: string) => {
  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (access) headers["Authorization"] = `Bearer ${access}`;
  if (refresh) headers["x-refresh-token"] = refresh;

  return fetch(url, { headers }).then((res) => res.json());
};

const TambahProdukModal: React.FC<TambahProdukModalProps> = ({ tableName }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data, error, isLoading } = useSWR("http://127.0.0.1:8000/api/stock/", fetcher);

  const handleAddProduct = (product: any) => {
    const quantity = quantities[product.id] ?? 1;
    const newItem = {
      name: product.name,
      jumlah_pesanan: "-",
      jumlah_barang: quantity,
      harga_beli: product.purchasePrice,
      subtotal: product.purchasePrice * quantity,
    };
    toast.success(`${product.name} berhasil ditambahkan`);
    dispatch(addRow({ tableName, row: newItem }));
  };

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, value),
    }));
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: () => (
        <div
          className="flex items-center gap-2 cursor-pointer font-medium"
          onClick={() => {
            const isDesc = sorting[0]?.id === "name" && sorting[0]?.desc;
            setSorting([{ id: "name", desc: !isDesc }]);
          }}
        >
          Produk {sorting[0]?.id === "name" && (sorting[0].desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
        </div>
      ),
    },
    { accessorKey: "barcode", header: "Barcode" },
    { accessorKey: "quantity", header: "Jumlah Stok" },
    { accessorKey: "boughtLast7Days", header: "Terbeli (7H)" },
    { accessorKey: "boughtLast30Days", header: "Terbeli (30H)" },
    { accessorKey: "soldLast7Days", header: "Terjual (7H)" },
    { accessorKey: "soldLast30Days", header: "Terjual (30H)" },
    {
        accessorKey: "price_buy",
        header: "Harga Beli",
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return value != null ? `Rp${value.toLocaleString("id-ID")}` : "-";
        },
      },      
    {
      accessorKey: "jumlahInput",
      header: "Jumlah",
      enableSorting: false,
      cell: ({ row }: { row: Row<any> }) => {
        const productId = row.original.id;
        const quantity = quantities[productId] ?? 1;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(productId, quantity - 1)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(productId, Math.max(1, Number(e.target.value)))}
              className="w-12 text-center border rounded"
              min={1}
            />
            <button
              onClick={() => handleQuantityChange(productId, quantity + 1)}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }: { row: Row<any> }) => (
        <Button onClick={() => handleAddProduct(row.original)} className="bg-blue-500 hover:bg-blue-600 size-7">
          <Plus />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>;

  return (
    <Card className="p-4">
      <div className="my-2 relative w-1/4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Cari Produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>
      <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[68vh] bg-white relative">
        <Table className="w-full min-w-[1000px] bg-white">
          <TableHeader className="sticky top-0 bg-gray-100 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-left">
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
                  <TableCell key={cell.id} className="text-left">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default TambahProdukModal;
