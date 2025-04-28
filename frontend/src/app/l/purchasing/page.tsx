"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSidebar } from "@/components/ui/sidebar";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
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
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { distributors } from '@/data/product';
import { DateRange } from 'react-day-picker';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DistributorDropdown } from '@/components/dropdown-checkbox/distributor-dropdown';
import { DistributorDropdownLP } from './distributor-dropdown';
import apiFetch from '@/lib/apiClient';
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

const PurchasingReport = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [data, setData] = useState<any[]>([]);

  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedDistributors, setSelectedDistributors] = useState<number[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let endpoint = "transactions/report/?transaction_type=PURCHASE";
  
      // Cek kalau tanggal sudah dipilih, tambahkan ke URL
      if (date?.from && date?.to) {
        const start = date.from.toLocaleDateString("sv-SE");
        const end = date.to.toLocaleDateString("sv-SE");
        endpoint += `&start_date=${start}&end_date=${end}`;
      }
      if (selectedDistributors.length > 0) {
        endpoint += `&supplier=${selectedDistributors.join(",")}`; // atau hanya ambil ids[0] kalau API-nya satu id saja
      }       
      console.log('url: ', endpoint)
  
      try {
        const json = await apiFetch(endpoint);
  
        const flatData = json.results.flatMap((transaction: any) =>
          transaction.items.map((item: any, index: number) => ({
            id: `${transaction.id}-${index}`,
            tanggal: index === 0 ? new Date(transaction.th_date).toLocaleDateString() : '',
            noFaktur: index === 0 ? transaction.th_code : '',
            pelanggan: index === 0 ? transaction.supplier_name : '',
            distributor: index === 0 ? transaction.cashier_username : '',
            sales: index === 0 ? transaction.bank_name : '',
            kode: item.stock_code,
            namaBarang: item.stock_name,
            jumlah: item.quantity,
            harga: item.sell_price,
            totalHarga: item.total,
            diskon: item.disc,
            netto: item.netto,
            status: transaction.th_status,
          }))
        );

      setData(flatData);
      setSummary(json.summary);  // Tambahkan state untuk summary jika perlu
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  fetchData();
}, [date, selectedDistributors]);

const columns = useMemo<ColumnDef<any>[]>(() => [
    { header: "Tanggal", accessorKey: "tanggal"},
    { header: "No. Faktur", accessorKey: "noFaktur"},
    { header: "Distributor", accessorKey: "distributor" },
    { header: "Sales", accessorKey: "sales" },
    { header: "Kode", accessorKey: "kode"},
    { header: "Nama Barang", accessorKey: "namaBarang" },
    { header: "Jumlah Barang", accessorKey: "jumlah" },
    { header: "Harga Jual", accessorKey: "harga" },
    { header: "Total Harga Barang", accessorKey: "totalHarga" },
    { header: "Diskon", accessorKey: "diskon", size: 200 },
    { header: "Netto", accessorKey: "netto" },
    { header: "Status", accessorKey: "status" },
  ], []);

  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  
    const table = useReactTable({
      data,
      columns,
      defaultColumn: {
        size: 150,        // ⬅️ Default semua kolom 200px
        minSize: 10,    // minimum size column saat resize
      maxSize: 1000,
      },
      getCoreRowModel: getCoreRowModel(),
      columnResizeDirection,
      enableColumnResizing: true,
      columnResizeMode: 'onChange'
    });

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="flex justify-left w-auto px-4 pt-4">
          <Card
          className={cn(
            state === "expanded" ? "min-w-[180vh]" : "w-full",
            "min-h-[calc(100vh-100px)] transition-all duration-300"
          )}
        >
            {/* <CardHeader>
              <CardTitle>Laporan Penjualan</CardTitle>
            </CardHeader> */}
        <CardContent>
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
                        className={cn(
                          "w-[300px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
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
                      <Button className="m-4 ml-100" onClick={() => setDate(undefined)}>Hapus</Button>
                    </PopoverContent>
                  </Popover>
              </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Distributor</Label>
                  <DistributorDropdownLP onChange={(ids) => setSelectedDistributors(ids)}/>
                </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Kategori</Label>
                  <DistributorDropdown/>
                </div>                  
              </div>
              <div className='flex items-end gap-2'>
              <div className={cn(
                        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                      )}>
                  <Search size={20} style={{ marginRight: '10px' }} />
                  <input type="text" placeholder="Cari" style={{ border: 'none', outline: 'none', flex: '1' }} />
                </div>
              </div>
            </div>

            <ScrollArea>
              <div className="max-h-[calc(100vh-240px)] overflow-x-auto overflow-y-auto max-w-screen">
                <table className="w-max text-sm border-separate border-spacing-0 min-w-full">
                <thead className="bg-gray-100 sticky top-0 z-10" style={{ position: 'relative', height: '40px' }}>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} style={{ position: 'relative', height: '40px' }}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          style={{
                            position: 'absolute',
                            left: header.getStart(),   // ⬅️ posisi horizontal
                            width: header.getSize(),   // ⬅️ width sesuai header
                          }}
                          className="text-left p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis bg-gray-100"
                        >
                          <div
                            className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{
                              lineHeight: '40px',
                              minHeight: '40px',
                            }}
                            title={String(header.column.columnDef.header ?? '')}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>

                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                  <tbody>
                    {table.getRowModel().rows.map((row, rowIndex) => (
                      <tr
                      key={row.id}
                      style={{ position: 'relative', height: '40px' }} // ⬅️ wajib
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                          key={cell.id}
                          style={{
                            position: 'absolute',
                            left: cell.column.getStart(), // ⬅️ posisi horizontal berdasarkan react-table
                            width: cell.column.getSize(),
                            height: '100%',
                            // backgroundColor: 'red',
                            top: '17px'
                          }}
                          className={cn(
                            "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis",
                            rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                          )}
                        >
                          <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{
                              lineHeight: '40px',
                              minHeight: '40px',
                            }}
                            title={String(cell.getValue() ?? '')}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </td>
                        
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

          <div className='flex gap-2 justify-between '>
            <h1 className='font-semibold'>
              Total Transaksi : {summary?.total_transactions ?? 0}
            </h1>
            <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasingReport; 