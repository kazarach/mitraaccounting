"use client";
import React, { useState, useEffect, useMemo } from 'react';
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Search } from 'lucide-react';
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

const SellingReport = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [data, setData] = useState<any[]>([]);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let url = "http://100.82.207.117:8000/api/transactions/report/?transaction_type=SALE";
      if (date?.from && date?.to) {
        const start = date.from.toLocaleDateString("sv-SE");
        const end = date.to.toLocaleDateString("sv-SE");
        url += `&start_date=${start}&end_date=${end}`;
      }
      if (selectedOperators.length > 0) {
        url += `&cashier=${selectedOperators.join(",")}`;
      }
      try {
        const response = await fetch(url);
        const json = await response.json();

        const flatData = json.results.flatMap((transaction: any) =>
          transaction.items.map((item: any, index: number) => ({
            id: `${transaction.id}-${index}`,
            tanggal: index === 0 ? new Date(transaction.th_date).toLocaleDateString() : '',
            noFaktur: index === 0 ? transaction.th_code : '',
            pelanggan: index === 0 ? transaction.customer_name : '',
            operator: index === 0 ? transaction.cashier_username : '',
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
        setSummary(json.summary);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    fetchData();
  }, [date, selectedOperators]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { header: "Tanggal", accessorKey: "tanggal", size: 120},
    { header: "No. Faktur", accessorKey: "noFaktur", size: 120 },
    { header: "Pelanggan", accessorKey: "pelanggan", size: 120 },
    { header: "Operator", accessorKey: "operator", size: 120 },
    { header: "Sales", accessorKey: "sales", size: 120 },
    { header: "Kode", accessorKey: "kode", size: 120 },
    { header: "Nama Barang", accessorKey: "namaBarang", size: 120 },
    { header: "Jumlah Barang", accessorKey: "jumlah", size: 120 },
    { header: "Harga Jual", accessorKey: "harga", size: 120 },
    { header: "Total Harga Barang", accessorKey: "totalHarga", size: 120 },
    { header: "Diskon", accessorKey: "diskon", size: 120 },
    { header: "Netto", accessorKey: "netto", size: 120 },
    { header: "Status", accessorKey: "status", size: 120 },
  ], []);

  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeDirection,
    enableColumnResizing: true,
    columnResizeMode: 'onChange'
  });
  

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="flex justify-left w-screen px-4 pt-4">
      <Card
      className={cn(
        state === "expanded" ? "max-w-[180vh]" : "w-full",
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
                      <SelectValue placeholder="Pilih Status" />
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
                  <input type="text" placeholder="Cari" style={{ border: 'none', outline: 'none', flex: '1' }} />
                </div>
              </div>
            </div>

            <ScrollArea>
              <div className="max-h-[calc(100vh-240px)] overflow-x-auto overflow-y-auto max-w-screen">
                <table className="w-max text-sm border-separate border-spacing-0 min-w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr >
                    {table.getHeaderGroups()[0]?.headers.map(header => (
                      <th
                      key={header.id}
                      style={{ width: header.getSize(), position: 'relative' }}
                      className="text-left p-2 border-b border-r last:border-r-0"
                    >
                      <div className="max-w-full overflow-hidden whitespace-nowrap text-ellipsis">
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

          <div className='flex gap-2 justify-between'>
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

export default SellingReport; 