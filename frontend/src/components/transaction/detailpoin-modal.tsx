"use client";
import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { poinMemberPelanggan } from '@/data/product';


interface DetailPoinProps {
  customerId: number;
}

const DetailPoin: React.FC<DetailPoinProps> = ({ customerId }) => {
  const [search, setSearch] = useState("");

  const selectedCustomer = poinMemberPelanggan.find((p) => p.id === customerId);
  const riwayatPoin = selectedCustomer?.riwayatPoin ?? [];

  const columns: ColumnDef<typeof riwayatPoin[number]>[] = [
    { accessorKey: "id", header: "No" },
    { accessorKey: "tanggal", header: "Tanggal" },
    { accessorKey: "keterangan", header: "Keterangan" },
    {
      accessorKey: "penambahan",
      header: "Penambahan",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return value > 0 ? `+${value}` : "-";
      }

    },
    {
      accessorKey: "pengurangan",
      header: "Pengurangan",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return value > 0 ? `+${value}` : "-";
      }
      
    },
    { accessorKey: "total", header: "Total" },
  ];

  const table = useReactTable({
    data: riwayatPoin,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Riwayat Poin - {selectedCustomer?.namaPelanggan}</DialogTitle>
      </DialogHeader>

      <div className="my-4 relative w-1/3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Cari Riwayat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
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

export default DetailPoin;
