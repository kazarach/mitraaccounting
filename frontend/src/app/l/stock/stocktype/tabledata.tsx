"use client";

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Table, TableBody, TableCaption, TableCell, TableFooter, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Eye, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DateRange } from "react-day-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { useSidebar } from '@/components/ui/sidebar';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import StockDD from './stock-dd';



const Stocktype = () => {

  const [date, setDate] = useState<DateRange | undefined>(undefined);  // Ubah ke undefined
  const [searchQuery, setSearchQuery] = useState('');
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const { state } = useSidebar(); // "expanded" | "collapsed"

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const url = startDate && endDate && selectedStockId
  ? `${API_URL}api/stock-changes/?start_date=${startDate}&end_date=${endDate}&stock=${selectedStockId}`
  : null;

  console.log("🌐 URL yang digunakan:", url);

  const { data: json, error, isLoading } = useSWR(
    url,
    fetcher
  );

  const flatData = useMemo(() => {
  if (!json || !json.transactions) return [];

  return json.transactions.map((item: any) => {
  const quantity = Number(item.quantity);
  return {
    date: format(new Date(item.transaction_time), "dd/MM/yyyy"),
    type: item.transaction_type,
    inQuantity: quantity > 0 ? quantity : "-",
    outQuantity: quantity < 0 ? quantity : "-",
    changeto: Number(item.stock_changed_to),
    buy: Number(item.buy_price),
    customer: item.customer,
    supplier: item.supplier,
  };
});
}, [json]);

  // console.log("data:",data)

  const filteredData = useMemo(() => {
      if (!searchQuery) return flatData;
      const lowerSearch = searchQuery.toLowerCase();
      
      return flatData.filter((item: any) =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(lowerSearch)
        )
      );
    }, [flatData, searchQuery]);

    const totalBarang = useMemo(() => filteredData.length, [filteredData]);

    const columns = useMemo<ColumnDef<any>[]>(() => [
      { header: "Tanggal", accessorKey: "date", size:130},
      { header: "Tipe Transaksi", accessorKey: "type"},
      { header: "Masuk",
            accessorKey: 'inQuantity',
            cell: ({ row }) => {
              const masuk = row.original.inQuantity;
          
              return (
                <div className="text-left">
                  {masuk === "-" ? "-" : Number(masuk).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      { header: "Keluar",
            accessorKey: 'outQuantity',
            cell: ({ row }) => {
              const keluar = row.original.outQuantity;
          
              return (
                <div className="text-left">
                  {keluar === "-" ? "-" : Number(keluar).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      { header: "Hasil Perubahan Stok",
            accessorKey: 'changeto',
            cell: ({ row }) => {
              const changedto = row.original.changeto;
          
              return (
                <div className="text-left">
                  {Number(changedto).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      { header: "Harga Beli",
            accessorKey: 'buy',
            cell: ({ row }) => {
              const pricebuy = row.original.buy;
          
              return (
                <div className="text-left">
                  {Number(pricebuy).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      {
        header: "Pelanggan",
        accessorKey: "customer",
        cell: ({ row }) => {
          const { outQuantity, customer } = row.original;
          return (
            <div className="text-left">
              {outQuantity !== "-" ? customer : "-"}
            </div>
          );
        },
      },
      {
        header: "Pemasok",
        accessorKey: "supplier",
        cell: ({ row }) => {
          const { inQuantity, supplier } = row.original;
          return (
            <div className="text-left">
              {inQuantity > 0 ? supplier : "-"}
            </div>
          );
        },
      },
    ], []);

    const table = useReactTable({
      data: filteredData,
      columns,
      defaultColumn: {
        size:160,
        enableResizing: true,
      },
      getCoreRowModel: getCoreRowModel(),
      columnResizeDirection,
      enableColumnResizing: true,
      columnResizeMode: 'onChange'
    });

    const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(filteredData); // filteredData sudah hasil dari pencarian
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stokperjenis");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(dataBlob, "Stol Per Jenis.xlsx");
};

  return (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="date-range">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant={"outline"}
                        className="w-auto h-[30px] justify-start text-left font-normal"
                        disabled={false}  // Disable jika range dipilih
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "dd/MM/y")} -{" "}
                              {format(date.to, "dd/MM/y")}
                            </>
                          ) : (
                            format(date.from, "dd/MM/y")
                          )
                        ) : (
                          <span>Pilih Tanggal</span>
                        )}
                      </Button>
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
                      <Button className="m-4 ml-100 bg-red-500 hover:bg-red-600" onClick={() => setDate(undefined)}>Hapus</Button>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col space-y-2">
                    <Label>Stok</Label>
                    <StockDD onChange={(id) => setSelectedStockId(id)}/>
                </div>


              </div>

              <div className='flex items-end gap-2'>
                <div className={cn(
                  "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                )}>
                  <Search size={20} style={{ marginRight: '10px' }} />
                  <input
                    type="text"
                    placeholder="Cari"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', flex: '1' }}
                  />
                </div>
              </div>
            </div>

            <ScrollArea
              className={cn(
                state === "collapsed"
                  ? "h-[calc(100vh-290px)]"  // contoh tinggi jika sidebar tertutup
                  : "h-[calc(100vh-290px)]", // tinggi default saat sidebar terbuka
                "overflow-x-auto overflow-y-auto max-w-screen"
              )}
            >
              <div className="w-max text-sm border-separate border-spacing-0 min-w-full">
                <Table >
                <TableHeader className="bg-gray-100 sticky top-0 z-10" >
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} style={{ position: 'relative', height: '40px' }}>
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          style={{
                            position: 'absolute',
                            left: header.getStart(),   // ⬅️ posisi horizontal
                            width: header.getSize(),   // ⬅️ width sesuai header
                          }}
                          className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis bg-gray-100"
                        >
                          <div
                            className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{
                              lineHeight: '20px',
                              minHeight: '20px',
                            }}
                            title={String(header.column.columnDef.header ?? '')}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>

                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-300"
                            />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="relative h-[40px] ">
                          {row.getVisibleCells().map((cell) => (
                          <TableCell
                              key={cell.id}
                              style={{
                              position: "absolute",
                              left: cell.column.getStart(),
                              width: cell.column.getSize(),
                              height: "100%",
                              }}
                              className="text-left p-2 border-b border-r last:border-r-0 whitespace-nowrap overflow-hidden"
                          >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                          ))}
                      </TableRow>
                      ))
                  ) : (
                      <TableRow>
                      <TableCell colSpan={columns.length} className="text-center  text-gray-400 bg-gray-200 ">
                          Pilih Tanggal dan Stok terlebih dahulu!
                      </TableCell>
                      </TableRow>
                  )}
                  </TableBody>

                <TableFooter className="sticky bg-gray-100 bottom-0 z-10 border-2">
                  <TableRow className="relative h-[40px]">
                      {table.getHeaderGroups()[0].headers.map((header, index) => {
                      const column = header.column;
                      let content: React.ReactNode = "";

                      // Tetapkan isi berdasarkan index kolom
                      switch (index) {
                          case 1:
                          content = "Total Barang:";
                          break;
                          case 2:
                          case 2:
                          content = filteredData.reduce((acc: number, item: any) => {
                            return acc + (typeof item.inQuantity === 'number' ? item.inQuantity : 0);
                          }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                          break;
                          case 3:
                          content = filteredData.reduce((acc: number, item: any) => {
                            return acc + (typeof item.outQuantity === 'number' ? item.outQuantity : 0);
                          }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                          break;
                          default:
                          content = "";
                      }

                      return (
                          <TableCell
                          key={column.id}
                          style={{
                              position: "absolute",
                              left: column.getStart(),
                              width: column.getSize(),
                              height: "100%",
                          }}
                          className="text-left font-bold border-b border-r last:border-r-0 whitespace-nowrap p-2 bg-gray-100"
                          >
                          {content}
                          </TableCell>
                      );
                      })}
                  </TableRow>
              </TableFooter>
              </Table>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" className='z-40' />
            </ScrollArea>

            <div className='flex gap-2 justify-between'>
              <div className='flex flex-col font-semibold max-w-[400px] w-[150px] bg-gray-100 p-2 rounded-md shadow-md'>
                  <h1>
                      Total Transaksi: <span className='text-blue-500'>{json?.total_transactions}</span>
                  </h1>
              </div>
              <Button onClick={exportToExcel} className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
            </div>
          </div>
  );
};

export default Stocktype;