"use client";
import React, { useEffect, useState } from 'react';

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

const PurchasingReport = () => {
  const [data, setData] = useState<any[]>([]);

  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedDistributors, setSelectedDistributors] = useState<number[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let url = "http://127.0.0.1:8000/api/transactions/report/?transaction_type=PAYMENT";
  
      // Cek kalau tanggal sudah dipilih, tambahkan ke URL
      if (date?.from && date?.to) {
        const start = date.from.toLocaleDateString("sv-SE");
        const end = date.to.toLocaleDateString("sv-SE");
        url += `&start_date=${start}&end_date=${end}`;
      }
      if (selectedDistributors.length > 0) {
        url += `&supplier=${selectedDistributors.join(",")}`; // atau hanya ambil ids[0] kalau API-nya satu id saja
      }       
  
      try {
        const response = await fetch(url);
        const json = await response.json();
  
        if (!json.results) return;

        type TransactionItem ={
          id: number;
          tanggal: string;
          th_date: Date;
          noFaktur: string;
          supplier: string;
          member: string;
          pelanggan: string;
          operator: string;
          kode: string;
          total: number;
          sales: string;
          netto: number;
          status: string;
          items: any[];
          diskon_trans: number;
        }

        const transformedData: TransactionItem[]= json.results.map((transaction: any): TransactionItem => ({
          id: transaction.id,
          tanggal: new Date(transaction.th_date).toLocaleDateString(),
          th_date: new Date(transaction.th_date),
          noFaktur: transaction.th_code,
          supplier: transaction.supplier_name,
          member: transaction.supplier_name,
          pelanggan: transaction.customer_name,
          operator: transaction.cashier_username,
          kode: transaction.stock_code,
          total: transaction.total,
          sales: transaction.bank_name,
          netto: transaction.netto,
          status: transaction.th_status ? "Sukses" : "Batal",
          items: transaction.items,
          diskon_trans: transaction.th_disc,
        })).sort((a: TransactionItem, b: TransactionItem) => a.th_date.getTime() - b.th_date.getTime());     

      setData(transformedData);
      setSummary(json.summary);  // Tambahkan state untuk summary jika perlu
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  fetchData();
}, [date, selectedDistributors]);

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Pembelian</CardTitle>
        </CardHeader>
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
            <div className="max-w-[1000px] max-h-[400px]">
              <Table className="table-striped">
                <TableHeader>
                  <TableRow>
                    <TableHead className='table-header'>Tanggal</TableHead>
                    <TableHead className="table-header text-left">No. Faktur</TableHead>
                    <TableHead className="table-header text-left">Distributor</TableHead>
                    <TableHead className="table-header text-left">Kode</TableHead>
                    <TableHead className="table-header text-left">Nama Barang</TableHead>
                    <TableHead className="table-header text-left">Jumlah Barang</TableHead>
                    <TableHead className="table-header text-left">Satuan</TableHead>
                    <TableHead className="table-header text-left">Harga Beli</TableHead>
                    <TableHead className="table-header text-left">Diskon Satuan</TableHead>
                    <TableHead className="table-header text-left">Diskon Transaksi</TableHead>
                    <TableHead className="table-header text-left">Netto</TableHead>
                    <TableHead className="table-header text-left">Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <React.Fragment key={item.id}>
                    <TableRow>
                      <TableCell className='table-header2'>{item.tanggal}</TableCell>
                      <TableCell className="table-header2 text-left">{item.noFaktur}</TableCell>
                      <TableCell className="table-header2 text-left">{item.supplier}</TableCell>
                      <TableCell className="text-left">
                        {item.items[0]?.stock_code ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        {item.items[0]?.stock_name ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        {item.items[0]?.quantity.toLocaleString("id-ID") ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">{item.items[0]?.unit}</TableCell>
                      <TableCell className="text-left">
                        Rp {item.items[0]?.stock_price_buy.toLocaleString("id-ID") ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">
                        Rp {item.items[0]?.disc.toLocaleString("id-ID") ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">Rp {item.diskon_trans ?? "0"}</TableCell>
                      <TableCell className="text-left">
                        Rp {item.items[0]?.netto.toLocaleString("id-ID") ?? "-"}
                      </TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>        
                    </TableRow>
                      {/* Baris untuk setiap item */}
                      {item.items.slice(1).map((itm: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-left">{itm.stock_code}</TableCell>
                          <TableCell className="text-left">{itm.stock_name}</TableCell>
                          <TableCell className="text-left">{itm.quantity}</TableCell>
                          <TableCell className="text-left">{itm.unit}</TableCell>
                          <TableCell className="text-left">Rp {itm.stock_price_buy}</TableCell>
                          <TableCell className="text-left">Rp {itm.disc}</TableCell>
                          <TableCell className="text-left">Rp {item.th_disc ?? "0"}</TableCell>
                          <TableCell className="text-left">
                          Rp {item.items[0]?.netto.toLocaleString("id-ID")}
                          </TableCell>
                          {/* <TableCell className="text-left">{item.status}</TableCell> */}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
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