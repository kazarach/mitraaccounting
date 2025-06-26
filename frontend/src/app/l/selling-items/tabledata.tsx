"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { useSidebar } from '@/components/ui/sidebar';
import { ColumnResizeDirection, ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { CategoryDropdown } from '@/components/dropdown-checkbox/category-dropdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Input } from '@/components/ui/input';

const SellingItems = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [Active, setActive] = React.useState<string | null>('true');
  const [range, setRange] = useState("today");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const queryParams = useMemo(() => {
    let params = `include_sales=true&transaction_type=SALE`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    if (Active !== null) {
    params += `&is_active=${Active}`;
    }

    return params;
  }, [date, Active]);

  console.log(queryParams)

  const shouldFetch = date?.from && date?.to;
  const { data: json, error, isLoading } = useSWR(
    shouldFetch ? `/api/proxy/api/stock/?${queryParams}` : null,
    fetcher
  );

  // Transform data
    const flatData = useMemo(() => {
  if (!json) return [];

  return json.map((item: any) => ({
    id: item.id,
    kode: item.code,
    namaBarang: item.name,
    unit: item.unit_name,
    pokok: Number(item.hpp),
    jmlJual: Math.abs(Number(item.sales_quantity_custom ?? 0)),
    jmlBeli: Number(item.purchase_quantity_custom ?? 0),
    jumlah: Number(item.available_quantity),
  }));
}, [json]);

    const filteredData = useMemo(() => {
        if (!searchQuery) return flatData;
        const lowerSearch = searchQuery.toLowerCase();
        
        return flatData.filter((item: any) =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(lowerSearch)
          )
        );
      }, [flatData, searchQuery]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
    { header: "Kode", accessorKey: "kode", size:120},
    { header: "Nama Barang", accessorKey: "namaBarang" ,size:200},
    { header: "Unit", accessorKey: "unit" ,size:50},
    { header: "Hrg Pokok",
          accessorKey: 'pokok',
          size:80,
          cell: ({ row }) => {
            const hrgpokok = row.original.pokok;
        
            return (
              <div className="text-left">
                {Number(hrgpokok).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    { header: "Jml Jual",
          accessorKey: 'jmlJual',
          size:80,
          cell: ({ row }) => {
            const jual = row.original.jmlJual;
        
            return (
              <div className="text-left">
                {Number(jual).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    { header: "T. Jual",
          accessorKey: 'ttlJual',
          size:80,
          cell: ({ row }) => {
            const totaljual = row.original.pokok * row.original.jmlJual;
        
            return (
              <div className="text-left">
                {Number(totaljual).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    { header: "Jml Beli",
          accessorKey: 'jmlBeli',
          size:80,
          cell: ({ row }) => {
            const beli = row.original.jmlBeli;
        
            return (
              <div className="text-left">
                {Number(beli).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    { header: "T. Beli",
          accessorKey: 'ttlBeli',
          size:80,
          cell: ({ row }) => {
            const totalbeli = row.original.pokok * row.original.jmlBeli;
        
            return (
              <div className="text-left">
                {Number(totalbeli).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    { header: "Jml Barang",
          accessorKey: 'jumlah',
          size:80,
          cell: ({ row }) => {
            const jmlbrg = row.original.jumlah;
        
            return (
              <div className="text-left">
                {Number(jmlbrg).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
  ], []);

  const table = useReactTable({
        data: filteredData,
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

      useEffect(() => {
          const timeout = setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100); // Delay kecil agar render selesai
        
          return () => clearTimeout(timeout);
        }, []);

      const exportToExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(filteredData); // filteredData sudah hasil dari pencarian
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Penjualan Per Barang`);
  
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });      
      saveAs(dataBlob, `Penjualan Per Barang.xlsx`);
    };

  return (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="date-range">Tanggal</Label>
                <div className='flex'>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                          "w-[200px] h-[30px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {/* <CalendarIcon className="mr-2 h-4 w-4" /> */}
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
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-[30px] h-[30px] ml-1"
                    onClick={() => setDate(undefined)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  </div>
              </div>
              <div className='flex flex-col space-y-2'>
                <Label>Status</Label>
                <Select onValueChange={(value) => setActive(value)} value={Active ?? undefined}>
                <SelectTrigger className="relative w-[150px] h-[30px] bg-gray-100 text-sm border-1 rounded-md">
                    <SelectValue placeholder="Pilih Tipe Bayar" className='text-sm' />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Tidak Aktif</SelectItem>
                </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Kategori</Label>
                  <CategoryDropdown/>
              </div>                                 
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Rak</Label>
                  <CategoryDropdown/>
              </div>                                 
              </div>
              <div className='flex items-end gap-2'>
              <div className='relative w-64'>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                      ref={searchInputRef}
                      placeholder="Cari"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10"
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
                              className="absolute right-0 top-0 h-full w-1 hover:bg-blue-300 cursor-col-resize select-none touch-none"
                            />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center top-[-150px] relative">
                        <Loading />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-red-500">
                        Gagal mengambil data
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-gray-400">
                        Pilih Tanggal terlebih dahulu!
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis",
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                            )}
                        style={{ position: 'relative', height: '35px' }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            style={{
                              position: 'absolute',
                              left: cell.column.getStart(),
                              width: cell.column.getSize(),
                              height: '100%',
                            }}
                            className={cn(
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis",
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                            )}
                          >
                            <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                              style={{
                                lineHeight: '20px',
                                minHeight: '20px',
                              }}
                              title={String(cell.getValue() ?? '')}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" className='z-40' />
            </ScrollArea>
          <div className='flex gap-2 justify-end '>
            <Button className='bg-blue-500 hover:bg-blue-600' onClick={exportToExcel}>Cetak</Button>
          </div>
          </div>

  );
};

export default SellingItems; 