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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { cn, fetcher } from '@/lib/utils';
import { Search } from 'lucide-react';
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useSidebar } from '@/components/ui/sidebar';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';
import Loading from '@/components/loading';
import { ScrollBar, ScrollArea } from '@/components/ui/scroll-area';
import { CategoryDropdown } from '@/components/dropdown-checkbox/category-dropdown';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Input } from '@/components/ui/input';

const MonitoringReport = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [orderType, setOrderType] = useState<string>("sell"); // Default value is 'sell'
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  console.log(API_URL)

  // Dynamically build the query params based on the selected order type
  const queryParams = useMemo(() => {
    let params = `include_orders=true&transaction_type=${orderType === "buy" ? "PURCHASE" : "SALE"}`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    return params;
  }, [date, orderType]); // Ensure queryParams updates when orderType changes

  // Fetch the data using SWR with the dynamic queryParams
  const { data: json, error, isLoading } = useSWR(
    `${API_URL}api/stock/?${queryParams}`,
    fetcher
  );

  // Transform data
  const flatData = useMemo(() => {
    if (!json) return [];
  
    return json.map((product: any) => ({
      id: product.id,
      kode: product.code,                 
      namaBarang: product.name,           
      jumlah: product.quantity,           
      satuan: product.unit_name,
      pesanan: product.ordered_quantity,
      kurangStok: product.available_quantity - product.ordered_quantity,
      distributor: product.supplier_name,  
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
  
  const totalBarang = useMemo(() => filteredData.length, [filteredData]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
      { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
      { header: "Kode", accessorKey: "kode", size:120},
      { header: "Nama Barang", accessorKey: "namaBarang", size: 300 },
      { header: "Jml Barang",
          accessorKey: 'jumlah',
          size:100,
          cell: ({ row }) => {
            const jml = row.original.jumlah;
        
            return (
              <div className="text-left">
                {Number(jml).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
       },
      { header: "Satuan", accessorKey: "satuan", size:100},
      { header: "Dalam Pesanan",
          accessorKey: 'pesanan',
          size:100,
          cell: ({ row }) => {
            const psn = row.original.pesanan;
        
            return (
              <div className="text-left">
                {Number(psn).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
       },
      { header: "Kurang Stok",
          accessorKey: 'kurangStok',
          cell: ({ row }) => {
            const krg = row.original.kurangStok;
        
            return (
              <div className="text-left">
                {Number(krg).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
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

    const handleSelectChange = (value: string) => {
      setOrderType(value); // Update order type when dropdown value changes
    };

    useEffect(() => {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100); // Delay kecil agar render selesai
    
      return () => clearTimeout(timeout);
    }, []);

    const exportToExcel = () => {
      const worksheet = XLSX.utils.json_to_sheet(filteredData); // filteredData sudah hasil dari pencarian
      const workbook = XLSX.utils.book_new();
      const typeLabel = orderType === "sell" ? "penjualan" : "pembelian";
      XLSX.utils.book_append_sheet(workbook, worksheet, `Pantauan (${typeLabel}`);
  
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });      
      saveAs(dataBlob, `Pantauan Stok dan Pesanan (${typeLabel}).xlsx`);
    };

  return (
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="distributor">Kategori</Label>
                <CategoryDropdown/>
              </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="waktu">Pesanan</Label>
                  <Select value={orderType} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-[150px] h-[30px] cursor-pointer">
                      <SelectValue placeholder="Penjualan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Penjualan</SelectItem>
                      <SelectItem value="buy">Pembelian</SelectItem>
                    </SelectContent>
                  </Select>
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
            
          <div className='flex gap-2 justify-between '>
            <div className='flex flex-col font-semibold max-w-[150px] w-[150px] bg-gray-100 p-2 rounded-md shadow-md'>
            <h1 className='font-semibold'>
            Total Barang : <span className='text-blue-500'>{totalBarang}</span>
            </h1>
            </div>
            <Button className='bg-blue-500 hover:bg-blue-600' onClick={exportToExcel}>Cetak</Button>
          </div>
          </div>
  );
};

export default MonitoringReport; 