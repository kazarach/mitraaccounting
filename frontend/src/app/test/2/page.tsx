"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

// Data utama
interface Item {
  id: string;
  harga: number;
  jumlah: number;
  diskon: number;
  total: number;
}

// State sementara (input string)
type TempItem = {
  harga: string;
  jumlah: string;
  diskon: string;
};

// Utility buat row baru
const createRow = (): Item => ({
  id: crypto.randomUUID(),
  harga: 0,
  jumlah: 0,
  diskon: 0,
  total: 0,
});

export default function TableFormOnBlurTanStack() {
  const [data, setData] = useState<Item[]>([
    { id: crypto.randomUUID(), harga: 10000, jumlah: 1, diskon: 0, total: 10000 },
    { id: crypto.randomUUID(), harga: 20000, jumlah: 2, diskon: 10, total: 36000 },
  ]);

  const [tempInputs, setTempInputs] = useState<Record<string, TempItem>>(() =>
    Object.fromEntries(
      data.map((row) => [
        row.id,
        {
          harga: row.harga.toString(),
          jumlah: row.jumlah.toString(),
          diskon: row.diskon.toString(),
        },
      ])
    )
  );

  // ✅ 1 function untuk semua onChange
  const onInputChange = <K extends keyof TempItem>(
    rowId: string,
    field: K,
    value: string
  ) => {
    setTempInputs((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value,
      },
    }));
  };

  // ✅ 1 function onBlur untuk hitung total
  const onInputBlur = (rowId: string) => {
    const temp = tempInputs[rowId];
    const harga = parseFloat(temp.harga) || 0;
    const jumlah = parseFloat(temp.jumlah) || 0;
    const diskon = parseFloat(temp.diskon) || 0;

    setData((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const subtotal = harga * jumlah;
          const diskonValue = subtotal * (diskon / 100);
          return {
            ...row,
            harga,
            jumlah,
            diskon,
            total: subtotal - diskonValue,
          };
        }
        return row;
      })
    );
  };

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        header: "Harga Barang",
        accessorKey: "harga",
        cell: ({ row }) => (
          <Input
            type="number"
            value={tempInputs[row.original.id]?.harga || ""}
            onChange={(e) => onInputChange(row.original.id, "harga", e.target.value)}
            onBlur={() => onInputBlur(row.original.id)}
          />
        ),
      },
      {
        header: "Jumlah Barang",
        accessorKey: "jumlah",
        cell: ({ row }) => (
          <Input
            type="number"
            value={tempInputs[row.original.id]?.jumlah || ""}
            onChange={(e) => onInputChange(row.original.id, "jumlah", e.target.value)}
            onBlur={() => onInputBlur(row.original.id)}
          />
        ),
      },
      {
        header: "Diskon (%)",
        accessorKey: "diskon",
        cell: ({ row }) => (
          <Input
            type="number"
            value={tempInputs[row.original.id]?.diskon || ""}
            onChange={(e) => onInputChange(row.original.id, "diskon", e.target.value)}
            onBlur={() => onInputBlur(row.original.id)}
          />
        ),
      },
      {
        header: "Total Harga",
        accessorKey: "total",
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.total.toLocaleString("id-ID")}
          </span>
        ),
      },
    ],
    [tempInputs]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id, // gunakan id unik untuk jaga fokus
  });

  const grandTotal = data.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="p-4">
      <table className="w-full border">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th className="border p-2" key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td className="border p-2" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="border p-2 font-bold text-right">
              Grand Total:
            </td>
            <td className="border p-2 font-bold">
              {grandTotal.toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
