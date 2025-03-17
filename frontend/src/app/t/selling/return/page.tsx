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
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

const OrderSelling = () => {
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

  const distributors = [
    {
      value: "1",
      label: "Distributor A",
    },
    {
      value: "2",
      label: "Distributor B",
    },
    {
      value: "3",
      label: "Distributor C",
    },
    {
      value: "4",
      label: "Distributor D",
    },
    {
      value: "5",
      label: "Distributor E",
    },

  ]

  const [date, setDate] = React.useState<Date>()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Retur Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Pelanggan</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value)?.label
                          : "Pilih Pelanggan"}
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
                                    setValue(selectedDistributor.value);
                                  } else {
                                    setValue("");
                                  }
                                  setOpen(false);
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
                  <Label htmlFor="date">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          
                        )}
                      >
                        <CalendarIcon />
                        {date ? format(date, "PPP") : <span>Pilih Tanggal</span>}
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
              </div>
              <div className='flex items-end gap-2'>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Tambah Produk</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <TambahProdukModal/>
                    </DialogContent>
                </Dialog>
                <Button className='border-red-500 border bg-white text-red-500 hover:bg-red-500 hover:text-white'>Batal</Button>
              </div>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-left">Jumlah Pesanan</TableHead>
                    <TableHead className="text-left">Jumlah barang</TableHead>
                    <TableHead className="text-left">Isi Packing</TableHead>
                    <TableHead className="text-left">Satuan</TableHead>
                    <TableHead className="text-left">Harga Beli</TableHead>
                    <TableHead className="text-left">Diskon (%)</TableHead>
                    <TableHead className="text-left">Diskon (Rp)</TableHead>
                    <TableHead className="text-left">Total</TableHead>
                    <TableHead className="text-left">Inc. PPN</TableHead>
                    <TableHead className="text-left">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produk}</TableCell>
                        <TableCell className="text-left">{item.jumlah_pesanan}</TableCell>
                        <TableCell className="text-left"><input type="number" className='text-left w-24 bg-gray-100 rounded-sm' placeholder='0' /></TableCell>
                        <TableCell className="text-left">{item.isi_packing}</TableCell>
                        <TableCell className="text-left">{item.satuan}</TableCell>
                        <TableCell className="text-left"><input type="number" className='text-left w-24 bg-gray-100 rounded-sm' placeholder='Rp0' /></TableCell>
                        <TableCell className="text-left"><input type="number" className='text-left w-24 bg-gray-100 rounded-sm' placeholder='0%' /></TableCell>
                        <TableCell className="text-left"><input type="number" className='text-left w-24 bg-gray-100 rounded-sm' placeholder='Rp0' /></TableCell>
                        <TableCell className="text-left">Rp{item.subtotal.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-left">Rp{(item.subtotal * 1.11).toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">
                            <Button className='bg-red-500 hover:bg-red-600 size-7'>
                            <Trash></Trash>
                            </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          <div className='flex gap-2 justify-end '>
            <Button className='bg-green-500 hover:bg-green-600'>Tambah </Button>
            <Button className='bg-red-500 hover:bg-red-600'>Hapus</Button>
            <Button className='bg-blue-500 hover:bg-blue-600'>Simpan</Button>
            <Button className='bg-blue-500 hover:bg-blue-600'>Retur dengan Nota</Button>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSelling; 