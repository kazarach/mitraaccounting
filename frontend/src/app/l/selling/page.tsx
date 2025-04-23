"use client";
import React, { useState, useEffect } from 'react';

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
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Eye, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format, addDays } from 'date-fns';
import OperatorDD from '@/components/dropdown-normal/operator_dd';
import MemberDD from '@/components/dropdown-normal/member_dd';
import { DateRange } from "react-day-picker";
import SalesDD from '@/components/dropdown-normal/sales_dd';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { OperatorDropdown } from '@/components/dropdown-checkbox/operator-dropdown';
import { OperatorDropdownLS } from './operator-dropdown';

const SellingReport = () => {
  const [data, setData] = useState<any[]>([]);

  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let url = "http://127.0.0.1:8000/api/transactions/report/?transaction_type=SALE";
  
      // Cek kalau tanggal sudah dipilih, tambahkan ke URL
      if (date?.from && date?.to) {
        const start = date.from.toLocaleDateString("sv-SE");
        const end = date.to.toLocaleDateString("sv-SE");
        url += `&start_date=${start}&end_date=${end}`;
      }
      if (selectedOperators.length > 0) {
        url += `&cashier=${selectedOperators.join(",")}`; // atau hanya ambil ids[0] kalau API-nya satu id saja
      }       
  
      try {
        const response = await fetch(url);
        const json = await response.json();
  
        if (!json.results) return;

        const transformedData = json.results.map((transaction: any) => ({
          id: transaction.id,
          tanggal: new Date(transaction.th_date).toLocaleDateString(),
          noFaktur: transaction.th_code,
          member: transaction.supplier_name,
          pelanggan: transaction.customer_name,
          operator: transaction.cashier_username,
          kode: transaction.stock_code,
          total: transaction.total,
          sales: transaction.bank_name,
          netto: transaction.netto,
          status: transaction.th_status ? "Sukses" : "Batal",
          items: transaction.items,
        }));      

      setData(transformedData);
      setSummary(json.summary);  // Tambahkan state untuk summary jika perlu
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  fetchData();
}, [date, selectedOperators]);

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Laporan Penjualan</CardTitle>
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
                    <SelectTrigger className="w-[180px]">
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

            <div className="rounded-md border overflow-auto">
              <Table className='table-striped'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-left">No. Faktur</TableHead>
                    <TableHead className="text-left">Pelanggan</TableHead>
                    <TableHead className="text-left">Operator</TableHead>
                    <TableHead className="text-left">Sales</TableHead>
                    <TableHead className="text-left">Kode</TableHead>
                    <TableHead className="text-left">Nama Barang</TableHead>
                    <TableHead className="text-left">Jumlah Barang</TableHead>
                    <TableHead className="text-left">Harga Jual</TableHead>
                    <TableHead className="text-left">Total Harga Barang</TableHead>
                    <TableHead className="text-left">Diskon</TableHead>
                    <TableHead className="text-left">Netto</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Baris utama transaksi */}
                      <TableRow>
                        <TableCell>{item.tanggal}</TableCell>
                        <TableCell className="text-left">{item.noFaktur}</TableCell>
                        <TableCell className="text-left">{item.pelanggan}</TableCell>
                        <TableCell className="text-left">{item.operator}</TableCell>
                        <TableCell className="text-left">{item.sales}</TableCell>
                        <TableCell className="text-left">
                          {item.items[0]?.stock_code ?? "-"}
                        </TableCell>
                        <TableCell className="text-left">
                          {item.items[0]?.stock_name ?? "-"}
                        </TableCell>
                        <TableCell className="text-left">
                          {item.items[0]?.quantity.toLocaleString("id-ID") ?? "-"}
                        </TableCell>
                        <TableCell className="text-left">Rp {item.items[0]?.sell_price.toLocaleString("id-ID") ?? "-"}</TableCell>
                        <TableCell className="text-left">Rp {item.items[0]?.total.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-left">
                          Rp {item.items[0]?.disc ?? "-"}
                        </TableCell>
                        <TableCell className="text-left">
                          Rp {item.items[0]?.netto.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-left">{item.status}</TableCell>
                      </TableRow>

                            {/* Baris untuk setiap item */}
                            {item.items.slice(1).map((itm: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell colSpan={5}></TableCell>
                                <TableCell className="text-left">{itm.stock_code}</TableCell>
                                <TableCell className="text-left">{itm.stock_name}</TableCell>
                                <TableCell className="text-left">{itm.quantity}</TableCell>
                                <TableCell className="text-left">Rp {itm.sell_price}</TableCell>
                                <TableCell className="text-left">Rp {itm.total}</TableCell>
                                <TableCell className="text-left">Rp {itm.disc}</TableCell>
                                <TableCell className="text-left">
                                Rp {item.items[0]?.netto.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-left">{item.status}</TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </TableBody>
              </Table>
            </div>

          <div className='flex gap-2 justify-end '>
            <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
          </div>
          <div>
            <h1 className='font-semibold'>
              Total Transaksi : {summary?.total_transactions ?? 0}
            </h1>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingReport; 