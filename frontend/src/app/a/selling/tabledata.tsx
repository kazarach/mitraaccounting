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
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { Eye, Search, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useSidebar } from '@/components/ui/sidebar';
import { ColumnResizeDirection, ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { SellingDetailModal } from './modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerDropdownAS } from './customer-dropdown';
import { OperatorDropdownAS } from './operator-dropdown';
import { BankDDAS } from './bank-dd';

const SellingArchive = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedDistributors, setSelectedDistributors] = useState<number[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number[]>([]);
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [paymentType, setPaymentType] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  console.log(API_URL)

  const queryParams = useMemo(() => {
    let params = `th_type=SALE&th_status=true&th_order=false`;
    if (date?.from && date?.to) {
      const start = date.from.toLocaleDateString("sv-SE");
      const end = date.to.toLocaleDateString("sv-SE");
      params += `&start_date=${start}&end_date=${end}`;
    }
    if (selectedDistributors.length > 0) {
      params += `&cashier=${selectedDistributors.join(",")}`;
    }
    if (selectedCustomer.length > 0) {
      params += `&customer=${selectedCustomer.join(",")}`;
    }
    if (selectedBankIds.length > 0) {
      params += `&bank=${selectedBankIds.join(",")}`;
    }
    if (paymentType) {
      params += `&th_payment_type=${paymentType}`;
    }
    return params;
  }, [date, selectedDistributors, selectedCustomer, selectedBankIds, paymentType]);

  const { data: json, error, isLoading } = useSWR(`${API_URL}api/transactions/?${queryParams}`, fetcher);

  const flatData = useMemo(() => {
    if (!json) return [];
  
    return json.map((transaction: any, index: number) => ({
      id: `${transaction.id}`,
      tanggal: format(new Date(transaction.th_date), "dd/MM/yyyy"),
      noFaktur: transaction.th_code,
      distributor: transaction.supplier_name,
      pelanggan: transaction.customer_name,
      operator: transaction.cashier_username,
      tipe: transaction.th_payment_type,
      kas: transaction.bank_name ?? "-",
      retur: transaction.th_return ? "Iya" : "Tidak",
      total: transaction.th_total, // total per transaksi, bukan per item
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

      const totalTransaksi = useMemo(() => filteredData.length, [filteredData]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { header: "Tanggal", accessorKey: "tanggal", size: 100},
    { header: "No. Faktur", accessorKey: "noFaktur"},
    { header: "Pelanggan", accessorKey: "pelanggan", size: 190},
    { header: "Sales", accessorKey: "operator" },
    { header: "Tipe Bayar", accessorKey: "tipe" },
    { header: "Nama Bank", accessorKey: "kas" },
    { header: "Diretur", accessorKey: "retur" },
    { header: "Total Transaksi",
          accessorKey: 'total',
          cell: ({ row }) => {
            const tot = row.original.total;
        
            return (
              <div className="text-left">
                {Number(tot).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </div>
            );
          },
    },
    {
      header: "Aksi",
      size: 60,
      id: "action", // kolom tanpa accessorKey harus pakai id
      cell: ({ row }) => (
        <Button
          className='h-[20px] bg-blue-500 hover:bg-blue-600'
          onClick={() => {
            const transaksiId = row.original.id;
            const transaksi = json?.find((t: any) => String(t.id) === transaksiId);
            if (transaksi) {
              setSelectedTransaction(transaksi.items); // ambil detail items dari transaksi
              setIsDialogOpen(true);
            }
          }}
        >
          <Eye/>
        </Button>
      ),
    },
  ], []);
  
  const table = useReactTable({
    data: filteredData,
    columns,
    defaultColumn: {
      size: 170,        // ⬅️ Default semua kolom 200px
      minSize: 10,    // minimum size column saat resize
    maxSize: 1000,
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeDirection,
    enableColumnResizing: true,
    columnResizeMode: 'onChange'
  });

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["s_pesanan"] || []);

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
                  <Label htmlFor="distributor">Sales</Label>
                  <OperatorDropdownAS onChange={(ids) => setSelectedDistributors(ids)}/>
                </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Pelanggan</Label>
                  <CustomerDropdownAS onChange={(ids) => setSelectedCustomer(ids)}/>
                </div>
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Bank</Label>
                  <BankDDAS onChange={setSelectedBankIds} />
                </div>               
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Tipe Bayar</Label>
                  <Select onValueChange={(value) => setPaymentType(value)} value={paymentType ?? undefined}>
                  <SelectTrigger className="relative w-[150px] h-[30px] bg-gray-100 rounded-md text-sm border-1 ">
                      <SelectValue placeholder="Semua" className='text-sm' />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="CREDIT">Kartu Kredit</SelectItem>
                      <SelectItem value="BANK">Transfer Bank</SelectItem>
                      <SelectItem value="CASH">Tunai</SelectItem>
                      <Button className=" m-1 mt-3 w-auto h-[30px] bg-red-500 hover:bg-red-600" onClick={() => setPaymentType(null)}>Hapus</Button>
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
                        Tidak ada produk ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        onClick={() => {
                          const transaksiId = row.original.id;
                          const transaksi = json?.find((t: any) => String(t.id) === transaksiId);
                          if (transaksi) {
                            setSelectedTransaction(transaksi);
                            setIsDialogOpen(true);
                          }
                        }}
                        className="cursor-pointer hover:bg-gray-200"
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
                Total Transaksi : <span className='text-blue-500'>{totalTransaksi}</span> 
                </h1>
              </div>
            </div>


          {isDialogOpen && selectedTransaction && (
            <SellingDetailModal
              open={isDialogOpen}
              onClose={setIsDialogOpen}
              transaction={selectedTransaction}
            />
          )}

          </div>
  );
};

export default SellingArchive; 