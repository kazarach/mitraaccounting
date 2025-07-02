"use client";
import React, { useEffect, useState } from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Copy, Plus, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from '@tanstack/react-table';

import useSWR from 'swr';
import Loading from '../loading';
import { DateRange } from 'react-day-picker';
import { DistributorDropdown } from '../dropdown-checkbox/distributor-dropdown';
import { OperatorDropdown } from '../dropdown-checkbox/operator-dropdown';
import { Description } from '@radix-ui/react-dialog';

const TpModal = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  const [distributor, setDistributor] = useState<number[]>([]);
  const [operator, setOperator] = useState<number[]>([]);


  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const start = date?.from ? format(date.from, "yyyy-MM-dd") : undefined;
  const end = date?.to ? format(date.to, "yyyy-MM-dd") : undefined;

  const { data, error, isLoading } = useSWR(
    [start, end, distributor, operator],
    () => {
      const startParam = start ? `&start_date=${start}` : "";
      const endParam = end ? `&end_date=${end}` : "";
      const supplierParam = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";
      const operatorParam = operator.length > 0 ? `&cashier=${operator.join(",")}` : "";
      return fetcher(`${API_URL}api/transactions/?th_type=ORDEROUT&th_order=true${startParam}${endParam}${supplierParam}${operatorParam}`);
    }
  );

  const handleAddProduct = (row: any) => {
    const supplier = row.original.supplier;
    const th_type = row.original.th_type;
    const transaction_id = row.original.id;
    const th_date = row.original.th_date;
    const th_dp = row.original.th_dp;
    dispatch(clearTable({ tableName: "transaksi" }));
    
    if (row.original.items && row.original.items.length > 0) {
      row.original.items.forEach((item: any) => {
        const newItem = {
          barcode: item.barcode,
          stock_code: item.stock_code,
          stock_name: item.stock_name,
          unit: item.unit,
          conversion_unit: item.conversion_unit,
          jumlah_pesanan: parseFloat(item.quantity) || 1,
          quantity: parseFloat(item.quantity) || 1,
          stock_price_buy: parseFloat(item.stock_price_buy) || 0,
          stock_price_sell: parseFloat(item.sell_price) || 0,
          discount: item.disc ?? 0,
          netto: parseFloat(item.netto) || 0,
          total: parseFloat(item.total) || 0,
          stock: item.stock,
          th_type,
          supplier,
          transaction_id,
          th_date,
          th_dp,
        };
        
        console.log(newItem)
        dispatch(addRow({ tableName: "transaksi", row: newItem }));
      });

      // Success message
      toast.success("Items berhasil ditambahkan");
    } else {
      toast.error("No items found in this invoice.");
    }
  };




  const columns: ColumnDef<any>[] = [
    { accessorKey: "th_code", header: "No Faktur", meta: { width: 120 } },
    {
      accessorKey: "th_date",
      header: "Tanggal",
      cell: ({ getValue }) => {
        const rawValue = getValue();
        if (!rawValue || typeof rawValue !== 'string') return "-";
        const parsedDate = new Date(rawValue);
        if (isNaN(parsedDate.getTime())) return "-";
        return format(parsedDate, "d MMMM yyyy", { locale: id });
      },
    },

    { accessorKey: "supplier_name", header: "Pemasok" },
    {
      accessorKey: "th_total",
      header: "Total",
      cell: ({ getValue }) => `Rp${Number(getValue()).toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "th_dp",
      header: "DP",
      cell: ({ getValue }) => `Rp${Number(getValue()).toLocaleString("id-ID")}`,
    },
    { accessorKey: "cashier_username", header: "Operator" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: { row: Row<any> }) => (
        <Button onClick={() => handleAddProduct(row)} className="bg-blue-500 hover:bg-blue-600 size-7">
          <Plus />
        </Button>
      ),
      enableSorting: false,
    },
  ];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setSearch,
    state: { globalFilter: search }
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Pesanan</DialogTitle>
        <Description></Description>
      </DialogHeader>
      <div >
        <div className='flex justify-between'>
          <div>
            <div className='my-2 flex gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <div>
                    <Button
                      id="date-range"
                      variant={"outline"}
                      className={cn(
                        "w-[150px] h-[30px]  justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "dd/L/y")} -{" "}
                            {format(date.to, "dd/L/y")}
                          </>
                        ) : (
                          format(date.from, "dd/L/y")
                        )
                      ) : (
                        <span>Pilih Tanggal</span>
                      )}
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                  <Button className="m-4 ml-100" onClick={() => setDate(undefined)}>Hapus</Button>
                </PopoverContent>
              </Popover>
              <div className="flex flex-col space-y-2">
                <DistributorDropdown onChange={(ids) => setDistributor(ids)} />
              </div>
              <div className="flex flex-col space-y-2">
                <OperatorDropdown onChange={(id) => setOperator(id)} />
              </div>
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
        <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[70vh] bg-white relative">
          <Table className="w-full min-w-[1000px] bg-white">
            <TableHeader className="sticky top-0 bg-gray-100 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn(
                      "text-left truncate w-[90px]",
                      header.id === "th_code" && "w-[100px]",
                      header.id === "th_date" && "w-[100px]",
                      header.id === "supplier_name" && "w-[150px]",
                      header.id === "th_total" && "w-[150px]",
                      header.id === "th_dp" && "w-[150px]",
                      header.id === "cashier_username" && "w-[150px]",
                      header.id === "action" && "w-[20px]"

                    )}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="overflow-y-auto max-h-[60vh]">
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
              ) : table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="bg-white">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "text-left truncate w-[90px]",
                        cell.column.id === "th_code" && "w-[100px]",
                        cell.column.id === "th_date" && "w-[100px]",
                        cell.column.id === "supplier_name" && "w-[150px]",
                        cell.column.id === "th_total" && "w-[150px]",
                        cell.column.id === "th_dp" && "w-[150px]",
                        cell.column.id === "action" && "w-[20px]"
                      )}
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
    </div>

  )
}

export default TpModal
