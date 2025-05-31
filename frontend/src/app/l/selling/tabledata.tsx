"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useSidebar } from "@/components/ui/sidebar";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Search, Trash, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import MemberDD from '@/components/dropdown-normal/member_dd';
import { DateRange } from "react-day-picker";
import SalesDD from '@/components/dropdown-normal/sales_dd';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { OperatorDropdownLS } from './operator-dropdown';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnResizeDirection
} from '@tanstack/react-table';
import apiFetch from '@/lib/apiClient';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils'
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table';
import Loading from '@/components/loading';

const SellingReport = () => {
  const { state } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [range, setRange] = useState("today");

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  console.log(API_URL)

  const queryParams = useMemo(() => {
    let params = `range=${range}&transaction_type=SALE`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    if (selectedOperators.length > 0) {
      params += `&cashier=${selectedOperators.join(",")}`;
    }
    return params;
  }, [range, date, selectedOperators]);

  const { data: json, error, isLoading } = useSWR(`${API_URL}api/transactions/report/?${queryParams}`, fetcher);

  // Transform data
  const flatData = useMemo(() => {
    if (!json?.results) return [];

    return json.results.flatMap((transaction: any) =>
      transaction.items.map((item: any, index: number) => ({
        id: `${transaction.id}-${index}`,
        tanggal: index === 0 ? format(new Date(transaction.th_date), "dd/MM/yyyy") : '',
        noFaktur: index === 0 ? transaction.th_code : '',
        pelanggan: index === 0 ? transaction.customer_name : '',
        operator: index === 0 ? transaction.cashier_username : '',
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
    { header: "Tanggal", accessorKey: "tanggal"},
    { header: "No. Faktur", accessorKey: "noFaktur"},
    { header: "Sales", accessorKey: "operator" },
    { header: "Kode", accessorKey: "kode"},
    { header: "Nama Barang", accessorKey: "namaBarang" },
    { header: "Jumlah Barang", accessorKey: "jumlah" },
    { header: "Harga Jual", accessorKey: "harga" },
    { header: "Total Harga Barang", accessorKey: "totalHarga" },
    { header: "Diskon", accessorKey: "diskon", size: 200 },
    { header: "Netto", accessorKey: "netto" },
    { header: "Status", accessorKey: "status" },
  ], []);

  const table = useReactTable({
    data: filteredData, // pakai filteredData, bukan flatData langsung!
    columns,
    defaultColumn: {
      size: 150,
      minSize: 10,
      maxSize: 1000,
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeDirection,
    enableColumnResizing: true,
    columnResizeMode: 'onChange'
  });
  
  // if (isLoading) return <p>Loading...</p>;
  // if (error) return <p>Gagal mengambil data.</p>;

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
                          <span>Semua</span>
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
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="operator">Operator</Label>
                  <OperatorDropdownLS onChange={(ids) => setSelectedOperators(ids)} />
              </div>                                    
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="member">Member</Label>
                  <MemberDD />
              </div>                                                                        
              <div className="flex flex-col space-y-2">
                <Label htmlFor="member">Sales</Label>
                  <SalesDD/>
                </div>                  
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="waktu">Status</Label>
                  <Select>
                    <SelectTrigger className="w-[150px] h-[30px]">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hari Ini</SelectItem>
                      <SelectItem value="week">Mingguan</SelectItem>
                      <SelectItem value="month">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="waktu">Waktu</Label>
                  <Select
                    value={range}
                    onValueChange={(val) => setRange(val)}
                    disabled={!!(startDate && endDate)}  // Menonaktifkan jika tanggal dipilih
                  >
                    <SelectTrigger className="w-[150px] h-[30px]">
                      <SelectValue placeholder="Pilih Waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hari Ini</SelectItem>
                      <SelectItem value="week">Mingguan</SelectItem>
                      <SelectItem value="month">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
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
                  : "h-[calc(100vh-360px)]", // tinggi default saat sidebar terbuka
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
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-300 select-none touch-none"
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
                      <TableCell colSpan={columns.length} className="text-center">
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
                        Tidak ada produk ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
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
            </ScrollArea>

          <div className='flex gap-2 justify-between'>
            <div className='flex flex-col font-semibold max-w-[150px] w-[150px] bg-gray-100 p-2 rounded-md shadow-md'>
              <h1 className='font-semibold'>
                Total Transaksi : <span className='text-blue-500'>{json?.summary?.total_transactions ?? 0}</span>
              </h1>
            </div>
            <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
          </div>

          </div>
  );
};

export default SellingReport; 