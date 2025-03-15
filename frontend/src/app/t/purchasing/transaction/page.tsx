"use client";
import React, { useState } from 'react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';

const TransactionPurchase = () => {
  const [data, setData] = useState([
    {
      "id": 1,
      "produk": "Susu Coklat Bubuk",
      "jumlah_pesanan": 10,
      "jumlah_barang": 10,
      "isi_packing": 24,
      "satuan": "Kardus",
      "harga_beli": 150000,
      "diskon_persen": 5,
      "diskon_rupiah": 7500,
      "subtotal": 142500
    },
    {
      "id": 2,
      "produk": "Teh Hijau Organik",
      "jumlah_pesanan": 5,
      "jumlah_barang": 5,
      "isi_packing": 12,
      "satuan": "Pack",
      "harga_beli": 200000,
      "diskon_persen": 10,
      "diskon_rupiah": 20000,
      "subtotal": 180000
    },
    {
      "id": 3,
      "produk": "Kopi Arabika",
      "jumlah_pesanan": 8,
      "jumlah_barang": 8,
      "isi_packing": 6,
      "satuan": "Kardus",
      "harga_beli": 800000,
      "diskon_persen": 15,
      "diskon_rupiah": 120000,
      "subtotal": 680000
    }
  ]
  );

  const distributors = ["All", "Distributor A", "Distributor B", "Distributor C"];
  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [date, setDate] = React.useState<Date>()

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Transaksi Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[160px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Distributor</Label>
                  <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((distributor) => (
                        <SelectItem key={distributor} value={distributor}>
                          {distributor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex items-end'>
                <Button>Tambah Produk</Button>
              </div>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Jumlah Pesanan</TableHead>
                    <TableHead className="text-right">Jumlah barang</TableHead>
                    <TableHead className="text-right">Isi Packing</TableHead>
                    <TableHead className="text-right">Satuan</TableHead>
                    <TableHead className="text-right">Harga Beli</TableHead>
                    <TableHead className="text-right">Diskon (%)</TableHead>
                    <TableHead className="text-right">Diskon (Rp)</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.produk}</TableCell>
                      <TableCell className="text-right">{item.jumlah_pesanan}</TableCell>
                      <TableCell className="text-right"><input type="number" className='text-right w-28' placeholder='1' /></TableCell>
                      <TableCell className="text-right">{item.isi_packing}</TableCell>
                      <TableCell className="text-right">{item.satuan}</TableCell>
                      <TableCell className="text-right"><input type="number" className='text-right w-28' placeholder='Rp5.000' /></TableCell>
                      <TableCell className="text-right"><input type="number" className='text-right w-28' placeholder='5%' /></TableCell>
                      <TableCell className="text-right"><input type="number" className='text-right w-28' placeholder='Rp5.000' /></TableCell>
                      <TableCell className="text-right">{item.subtotal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionPurchase; 