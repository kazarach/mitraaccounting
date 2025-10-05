"use client";
import React, { useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fetcher } from '@/lib/utils';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useDispatch } from 'react-redux';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

import useSWR from 'swr';
import Loading from '@/components/loading';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DetailPointModalProps {
    open: boolean;
  onClose: (open: boolean) => void;
  transaction: any;

}

const DetailPointModal: React.FC<DetailPointModalProps> = ({ open, onClose, transaction}) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const customerId = transaction?.id;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const [transactionType, setTransactionType] = React.useState<string | null>(null);

  const { data, error, isLoading } = useSWR(
  customerId
    ? `/api/proxy/api/point-transactions/?customer=${customerId}${transactionType ? `&transaction_type=${transactionType}` : ""}`
    : null,
  fetcher
);

  const columns: ColumnDef<any>[] = [
    { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
    { accessorKey: "customer_name", header: "Nama Pelanggan" },
    {
      accessorKey: "points",
      header: "Transaksi Poin",
      cell: ({ getValue }) => {
        const raw = getValue();
        const num = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : NaN;

        return isNaN(num)
          ? "-"
          : num.toLocaleString("id-ID", {
              // minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
      }
    },
    {
      accessorKey: "balance_after",
      header: "Total Poin",
      cell: ({ getValue }) => {
        const raw = getValue();
        const num = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : NaN;

        return isNaN(num)
          ? "-"
          : num.toLocaleString("id-ID", {
              // minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
      }
    },
    {
      accessorKey: "updated_at",
      header: "Tanggal Transaksi",
      cell: ({ getValue }) => {
        const rawValue = getValue();
        if (!rawValue || typeof rawValue !== 'string') return "-";
        const parsedDate = new Date(rawValue);
        if (isNaN(parsedDate.getTime())) return "-";
        return format(parsedDate, "d/M/yyyy", { locale: id });
      },
    },
    { accessorKey: "note", header: "Keterangan" },
    { accessorKey: "transaction_type", header: "Tipe Transaksi" },
  ];

  const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onGlobalFilterChange: setSearch,
  state: { globalFilter: search },
  columnResizeDirection: "ltr",
  columnResizeMode: "onChange",
  defaultColumn: {
    size: 150,
    minSize: 50,
    maxSize: 600,
    enableResizing: true,
  },
});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" min-w-[30vw]"
      // onInteractOutside={(e) => e.preventDefault()}
      // onEscapeKeyDown={(e) => e.preventDefault()}
      >
    <div>
      <div >
        <div className='flex justify-between items-center my-2 w-full'>
          <div>
            <DialogTitle className='font-semibold'>Riwayat Poin - {transaction?.name}</DialogTitle>
          </div>
          <div className="my-2 w-45">
            <Select onValueChange={(value) => {
              setTransactionType(value === "null" ? null : value);
            }} value={transactionType ?? "null"}>
            <SelectTrigger className="bg-gray-100 text-sm border-2 w-[180px] rounded-md">
                <SelectValue placeholder="Semua" className='text-sm' />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="null">Semua</SelectItem>
                <SelectItem value="EARNED">Earned</SelectItem>
                <SelectItem value="REDEEMED">Redeemed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="ADJUSTED">Adjusted</SelectItem>
            </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto w-[1000px] max-w-screen">
          <div className="w-max text-sm border-separate border-spacing-0 min-w-full">
            <Table className=" bg-white ">
              <TableHeader className="bg-gray-100 sticky top-0 z-10 border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="relative h-[40px]">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100"
                        style={{
                          position: "absolute",
                          left: header.getStart(),
                          width: header.getSize(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}

                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none bg-transparent hover:bg-blue-300"
                            style={{ transform: "translateX(50%)" }}
                          />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={columns.length} className="text-center"><Loading /></TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={columns.length} className="text-center text-red-500">Gagal mengambil data</TableCell></TableRow>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <TableRow key={row.id} className="relative h-[40px]">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            position: "absolute",
                            left: cell.column.getStart(),
                            width: cell.column.getSize(),
                            height: "100%",
                          }}
                          className="p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={columns.length} className="text-center text-gray-400">Tidak ada produk ditemukan</TableCell></TableRow>
                )}
              </TableBody>


            </Table>
        </div>
        <ScrollBar orientation="horizontal"/>
        <ScrollBar orientation="vertical"/>
        </ScrollArea>

      </div>
    </div>
    </DialogContent>
    </Dialog>

  )
}

export default DetailPointModal
