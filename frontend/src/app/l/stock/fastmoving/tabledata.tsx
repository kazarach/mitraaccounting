"use client";

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Search } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useSidebar } from '@/components/ui/sidebar';



const FastMoving = () => {

  const [range, setRange] = useState("day");
  const [date, setDate] = useState<DateRange | undefined>(undefined);  // Ubah ke undefined
  const [searchQuery, setSearchQuery] = useState('');
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const { state } = useSidebar(); // "expanded" | "collapsed"

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const url = startDate && endDate
  ? `${API_URL}api/trans-items/fast_moving/?start_date=${startDate}&end_date=${endDate}`
  : range
  ? `${API_URL}api/trans-items/fast_moving/?range=${range}`
  : null;

  console.log("🌐 URL yang digunakan:", url);

  const { data: json, error, isLoading } = useSWR(
    url,
    fetcher
  );

  const flatData = useMemo(() => {
      if (!json) return [];
    
      return json.map((transaction: any) => ({
        id: transaction.stock_id,
        name: transaction.stock_name,
        code: transaction.stock_barcode,
        quantity: transaction.total_quantity,
        supplier: transaction.stock_supplier,
      }));
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
      { header: "Code", accessorKey: "code"},
      { header: "Nama Produk", accessorKey: "name"},
      { header: "Jumlah", accessorKey: "quantity"},
      { header: "Pemasok", accessorKey: "supplier"},
    ], []);

    const table = useReactTable({
      data: filteredData,
      columns,
      defaultColumn: {
        size:300,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "FastMoving");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(dataBlob, "FastMoving.xlsx");
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
                      <Button className="m-4 ml-100" onClick={() => setDate(undefined)}>Hapus</Button>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="waktu">Waktu</Label>
                  <Select
                    value={range}
                    onValueChange={(val) => setRange(val)}
                    disabled={!!(startDate && endDate)}  // Menonaktifkan jika tanggal dipilih
                  >
                    <SelectTrigger className="w-auto h-[30px] cursor-pointer">
                      <SelectValue placeholder="Pilih Waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hari Ini</SelectItem>
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
                  : "h-[calc(100vh-290px)]", // tinggi default saat sidebar terbuka
                "overflow-x-auto overflow-y-auto max-w-screen"
              )}
            >
              <div className="w-max text-sm border-separate border-spacing-0 min-w-[100px]">
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center top-[-200px] absolute left-1/2 -translate-x-1/2">
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
                      <TableCell colSpan={columns.length} className="text-center text-gray-400 absolute left-1/2 -translate-x-1/2 ">
                        Pilih Tanggal atau Rentang Waktu
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-gray-100 "
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
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap relative text-ellipsis",
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

            <div className='flex gap-2 justify-between'>
              <div className='flex flex-col font-semibold max-w-[180px] w-[180px] bg-gray-100 p-2 rounded-md shadow-md'>
              <h1 className='font-semibold'>
                Total Jenis Barang: <span className='text-blue-500'>{totalBarang}</span>
              </h1>
              </div>
              <Button onClick={exportToExcel} className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
            </div>
          </div>
  );
};

export default FastMoving;
