"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSidebar } from "@/components/ui/sidebar";

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DistributorDropdownLP } from './distributor-dropdown';
import { fetcher } from '@/lib/utils'
import { ColumnDef, ColumnResizeDirection, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import useSWR from 'swr';
import Loading from '@/components/loading';
import { CategoryDropdown } from '@/components/dropdown-checkbox/category-dropdown';
import { Input } from '@/components/ui/input';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { OperatorDropdownLP } from './operator-dd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PurchasingReport = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedDistributors, setSelectedDistributors] = useState<number[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [range, setRange] = useState("today");
  const [statusType, setStatusType] = useState<string | null>(null);

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  console.log(API_URL)

  const queryParams = useMemo(() => {
    let params = `range=${range}&transaction_type=PURCHASE`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    if (selectedDistributors.length > 0) {
      params += `&supplier=${selectedDistributors.join(",")}`;
    }
    if (selectedOperators.length > 0) {
      params += `&cashier=${selectedOperators.join(",")}`;
    }
    if (statusType) {
      params += `&status=${statusType}`;
    }
    return params;
  }, [date, selectedDistributors, selectedOperators, range, statusType]);

  const { data: json, error, isLoading } = useSWR(`/api/proxy/api/transactions/report/?${queryParams}`, fetcher);

  // Transform data
    const flatData = useMemo(() => {
      if (!json?.results) return [];
  
      return json.results.flatMap((transaction: any) =>
        transaction.items.map((item: any, index: number) => ({
          id: `${transaction.id}-${index}`,
            tanggal: index === 0 ? format(new Date(transaction.th_date), "dd/MM/yyyy") : '',
            noFaktur: index === 0 ? transaction.th_code : '',
            distributor: index === 0 ? transaction.supplier_name : '',
            sales: index === 0 ? transaction.cashier_username : '',
            kode: item.stock_code,
            namaBarang: item.stock_name,
            jumlah: item.quantity,
            harga: item.stock_price_buy,
            totalHarga: item.quantity * item.stock_price_buy,
            diskon: item.disc,
            netto: item.netto,
            status: transaction.th_status ? "Berhasil" : "Gagal",
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
    { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
    { header: "Tgl", accessorKey: "tanggal", size:100},
    { header: "No. Faktur", accessorKey: "noFaktur", size:150},
    { header: "Kode", accessorKey: "kode", size:120},
    { header: "Distributor", accessorKey: "distributor" },
    { header: "Sales", accessorKey: "sales" },
    { header: "Nama Barang", accessorKey: "namaBarang" },
    { header: "Jml Barang",
        accessorKey: 'jumlah',
        size:80,
        cell: ({ row }) => {
          const jml = row.original.jumlah;
      
          return (
            <div className="text-left">
              {Number(jml).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
    { header: "Hrg Beli",
        accessorKey: 'harga',
        size:80,
        cell: ({ row }) => {
          const hrg = row.original.harga;
      
          return (
            <div className="text-left">
              {Number(hrg).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
      { header: "T. Hrg Barang",
        accessorKey: 'totalHarga',
        size:100,
        cell: ({ row }) => {
          const ttl = row.original.totalHarga;
      
          return (
            <div className="text-left">
              {Number(ttl).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
      { header: "Diskon",
        accessorKey: 'diskon',
        size:80,
        cell: ({ row }) => {
          const dkn = row.original.diskon;
      
          return (
            <div className="text-left">
              {Number(dkn).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
      { header: "Netto",
        accessorKey: 'netto',
        size:80,
        cell: ({ row }) => {
          const net = row.original.netto;
      
          return (
            <div className="text-left">
              {Number(net).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
          );
        },
      },
    { header: "Status", accessorKey: "status" },
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
      XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan Pembelian`);
  
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });      
      saveAs(dataBlob, `Laporan Pembelian.xlsx`);
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
              <div className="flex flex-col space-y-2">
                <Label htmlFor="distributor">Distributor</Label>
                <DistributorDropdownLP onChange={(ids) => setSelectedDistributors(ids)}/>
              </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="operator">Sales</Label>
                  <OperatorDropdownLP onChange={(ids) => setSelectedOperators(ids)} />
              </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Status</Label>
                  <Select onValueChange={(value) => setStatusType(value)} value={statusType ?? undefined}>
                  <SelectTrigger className="relative w-[150px] h-[30px] rounded-md text-sm border-1 ">
                      <SelectValue placeholder="Semua" className='text-sm' />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="true">Berhasil</SelectItem>
                      <SelectItem value="false">Gagal</SelectItem>
                      <Button className=" m-1 mt-3 w-auto h-[30px] bg-red-500 hover:bg-red-600" onClick={() => setStatusType(null)}>Hapus</Button>
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
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-blue-300 touch-none"
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
                        Pilih Tanggal atau Waktu terlebih dahulu!
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
            </ScrollArea>

          <div className='flex gap-2 justify-between '>
            <div className='flex flex-col font-semibold max-w-[150px] w-[150px] bg-gray-100 p-2 rounded-md shadow-md'>
              <h1 className='font-semibold'>
              Total Transaksi : <span className='text-blue-500'>{json?.summary?.total_transactions ?? 0}</span> 
              </h1>
            </div>
            <Button className='bg-blue-500 hover:bg-blue-600' onClick={exportToExcel}>Cetak</Button>
          </div>
          </div>
  );
};

export default PurchasingReport; 