"use client";
import React, { useMemo, useState } from 'react';

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
import { cn, fetcher } from '@/lib/utils';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useSidebar } from '@/components/ui/sidebar';
import { distributors } from '@/data/product';
import { ColumnResizeDirection, ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { OperatorDropdownSI } from './operator-dropdown';
import { CategoryDropdown } from '@/components/dropdown-checkbox/category-dropdown';
import { DistributorDropdownSI } from './distributor-dropdown';

const SellingItems = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedDistributors, setSelectedDistributors] = useState<number[]>([]);
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  console.log(API_URL)

  const queryParams = useMemo(() => {
    let params = `th_type=SALE`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    if (selectedDistributors.length > 0) {
      params += `&cashier=${selectedDistributors.join(",")}`;
    }
    if (selectedOperators.length > 0) {
      params += `&cashier=${selectedOperators.join(",")}`;
    }
    return params;
  }, [date, selectedDistributors, selectedOperators]);

  const { data: json, error, isLoading } = useSWR(`${API_URL}api/transactions/?${queryParams}`, fetcher);

  // Transform data
    const flatData = useMemo(() => {
      if (!json) return [];
  
      return json.flatMap((transaction: any) =>
        transaction.items.map((item: any, index: number) => ({
          id: `${transaction.id}-${index}`,
            tanggal: index === 0 ? format(new Date(transaction.th_date), "dd/MM/yyyy") : '',
            noFaktur: index === 0 ? transaction.th_code : '',
            distributor: index === 0 ? transaction.supplier_name : '',
            sales: index === 0 ? transaction.cashier_username : '',
            kode: item.stock_code,
            namaBarang: item.stock_name,
            jumlah: item.quantity,
            harga: item.sell_price,
            totalHarga: item.total,
            jmlJual: transaction.th_total
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
    { header: "Kode", accessorKey: "kode"},
    { header: "Nama Barang", accessorKey: "namaBarang" },
    { header: "Harga Jual", accessorKey: "harga" },
    { header: "Jumlah Penjualan", accessorKey: "jmlJual"},
    { header: "Penjualan Bruto", accessorKey: "bruto"},
    { header: "Jumlah Pembelian", accessorKey: "jmlBeli" },
    { header: "Pembelian Bruto", accessorKey: "belibruto" },
    { header: "Jumlah Barang", accessorKey: "jumlah" },
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

  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [open2, setOpen2] = React.useState(false)
  const [value2, setValue2] = React.useState("")
  const [open3, setOpen3] = React.useState(false)
  const [value3, setValue3] = React.useState("")
  const [open4, setOpen4] = React.useState(false)
  const [value4, setValue4] = React.useState("")
  const [open5, setOpen5] = React.useState(false)
  const [value5, setValue5] = React.useState("")
  const [open6, setOpen6] = React.useState(false)
  const [value6, setValue6] = React.useState("")
  const [open7, setOpen7] = React.useState(false)
  const [value7, setValue7] = React.useState("")

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
                  <Label htmlFor="distributor">Operator</Label>
                  <OperatorDropdownSI onChange={(ids) => setSelectedOperators(ids)}/>
                </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Kategori</Label>
                  <CategoryDropdown/>
                </div>                  
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Distributor</Label>
                  <DistributorDropdownSI onChange={(ids) => setSelectedDistributors(ids)}/>
                </div>                  
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Sales</Label>
                  <Popover open={open4} onOpenChange={setOpen4}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[150px] h-[30px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value4)?.label
                          : "Semua"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Distributor" />
                        <CommandList>
                          <CommandEmpty>No Distributor found.</CommandEmpty>
                          <CommandGroup>
                            {distributors.map((d) => (
                              <CommandItem
                                key={d.value}
                                value={d.label} 
                                data-value={d.value} 
                                onSelect={(currentLabel: string) => {
                                  const selectedDistributor = distributors.find((dist) => dist.label === currentLabel);
                                  if (selectedDistributor) {
                                    setValue4(selectedDistributor.value);
                                  } else {
                                    setValue4("");
                                  }
                                  setOpen4(false);
                                }}
                              >
                                {d.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === d.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>                  
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Pelanggan</Label>
                  <Popover open={open5} onOpenChange={setOpen5}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[150px] h-[30px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value5)?.label
                          : "Semua"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Distributor" />
                        <CommandList>
                          <CommandEmpty>No Distributor found.</CommandEmpty>
                          <CommandGroup>
                            {distributors.map((d) => (
                              <CommandItem
                                key={d.value}
                                value={d.label} 
                                data-value={d.value} 
                                onSelect={(currentLabel: string) => {
                                  const selectedDistributor = distributors.find((dist) => dist.label === currentLabel);
                                  if (selectedDistributor) {
                                    setValue5(selectedDistributor.value);
                                  } else {
                                    setValue5("");
                                  }
                                  setOpen5(false);
                                }}
                              >
                                {d.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === d.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

            <ScrollArea className="h-[calc(100vh-310px)] overflow-x-auto overflow-y-auto max-w-screen">
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
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none"
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
              <ScrollBar orientation="vertical" className='z-40' />
            </ScrollArea>
          <div className='flex gap-2 justify-end '>
            <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingItems; 