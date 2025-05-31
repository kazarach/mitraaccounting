"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DateRange } from "react-day-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { useSidebar } from '@/components/ui/sidebar';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SupDropdown } from './sup-dd';
import { SupexDropdown } from './supex-dd';
import { CategoryDropdown } from '@/components/dropdown-checkbox/category-dropdown';
import { Input } from '@/components/ui/input';

const StockValue1 = () => {

  const [range, setRange] = useState("category");
  const [searchQuery, setSearchQuery] = useState('');
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);
  const [selectedSuppliersex, setSelectedSuppliersex] = useState<number[]>([]);
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const searchInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const supplierParam = selectedSuppliers.length > 0 ? `&supplier=${selectedSuppliers.join(",")}` : "";
  const supplierexParam = selectedSuppliersex.length > 0 ? `&exclude_breakdown=${selectedSuppliersex.join(",")}` : "";
  const url = `${API_URL}api/stock/summary/?breakdown=${range}${supplierParam}${supplierexParam}`;

  console.log("🌐 URL yang digunakan:", url);

  const { data: json, error, isLoading } = useSWR(
    url,
    fetcher
  );

    const flatData = useMemo(() => {
    const key = `by_${range}`;
    const data = json?.[key];

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        count: item.count,
        quantity: item.quantity,
        value: item.value,
        low: item.low_stock_count,
    }));
    }, [json, range]);

  // console.log("data:",json)

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

    const handleSupplierChange = (ids: number[]) => {
    setSelectedSuppliers(ids);
    if (ids.length > 0){
    setRange("supplier"); // otomatis ubah breakdown
    }
    };
    const handleSupplierexChange = (ids: number[]) => {
    setSelectedSuppliersex(ids);
    if (ids.length > 0){
    setRange("supplier"); // otomatis ubah breakdown
    }
    };

    const columns = useMemo<ColumnDef<any>[]>(() => [
      { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
      { header: "Nama Produk", accessorKey: "name", size:250},
      { header: "Barang", accessorKey: "count", size:100},
      { header: "Jumlah Produk",
            accessorKey: 'quantity',
            size:150,
            cell: ({ row }) => {
              const jumlah = row.original.quantity;
          
              return (
                <div className="text-left">
                  {Number(jumlah).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      { header: "Nilai",
            accessorKey: 'value',
            size:150,
            cell: ({ row }) => {
              const nilai = row.original.value;
          
              return (
                <div className="text-left">
                  {Number(nilai).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
      { header: "Stok Rendah",
            accessorKey: 'low',
            cell: ({ row }) => {
              const lowstock = row.original.low;
          
              return (
                <div className="text-left">
                  {Number(lowstock).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
      },
    ], []);

    const table = useReactTable({
      data: filteredData,
      columns,
      defaultColumn: {
        size:250,
        enableResizing: true,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Opname Persediaan");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "Opname Persediaan.xlsx");
  };

  return (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">

                <div className="flex flex-col space-y-2 pointer-events-none">
                    <Label>Kategori</Label>
                    <CategoryDropdown/>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Pengecualian Kategori</Label>
                    <CategoryDropdown/>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label> Pemasok</Label>
                    <SupDropdown onChange={handleSupplierChange}/>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Pengecualian Pemasok</Label>
                    <SupexDropdown onChange={handleSupplierexChange}/>
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
                  ? "h-[calc(100vh-310px)]"  // contoh tinggi jika sidebar tertutup
                  : "h-[calc(100vh-310px)]", // tinggi default saat sidebar terbuka
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
                        Pilih Rincian terlebih dahulu
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap relative text-ellipsis",
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

            <div className='flex justify-between'>
                <div className='flex flex-col font-semibold'>
                    <div className='grid grid-cols-3 gap-x-4 bg-gray-100 rounded-md p-2 shadow-md'>
                    <h1 className='flex'>Total
                      <span className='ml-[56px]'>
                        :
                      </span>
                         <span className='text-blue-500 ml-1'>{totalBarang}</span>
                    </h1>
                    <h1 className='flex'>T. Barang
                      <span className='ml-[8px]'>
                        :
                      </span>
                      <span className='text-blue-500 ml-1'>{json?.total_items.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
                    </h1>
                    <h1 className='flex'>T. Tipe
                      <span className='ml-[81px]'>
                        :
                      </span>
                      <span className='text-blue-500 ml-1'>{json?.total_types.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
                    </h1>
                    <h1 className='flex'>T. Quantity
                      <span className='ml-[12px]'>
                        :
                      </span>
                      <span className='text-blue-500 ml-1'>{json?.total_quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
                    </h1>
                    <h1 className='flex'>T. Nilai
                      <span className='ml-[26px]'>
                        :
                      </span>
                      <span className='text-blue-500 ml-1'>{json?.total_value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
                    </h1>
                    <h1 className='flex'>Jml Stok Rendah
                      <span className='ml-[8px]'>
                        :
                      </span>
                      <span className='text-blue-500 ml-1'>{json?.low_stock_count.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
                    </h1>
                    </div>
                </div>
              <Button onClick={exportToExcel} className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
            </div>
    </div>
  );
};

export default StockValue1;