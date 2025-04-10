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
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

const SellingReport = () => {
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

  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [date, setDate] = React.useState<Date>()
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
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Operator</Label>
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
                          : "Pilih Operator"}
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
                  <Label htmlFor="distributor">Member</Label>
                  <Popover open={open4} onOpenChange={setOpen4}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value4)?.label
                          : "Pilih Member"}
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
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value5)?.label
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
              <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Sales</Label>
                  <Popover open={open6} onOpenChange={setOpen6}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value6)?.label
                          : "Pilih Sales"}
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
                                    setValue6(selectedDistributor.value);
                                  } else {
                                    setValue6("");
                                  }
                                  setOpen6(false);
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
                  <Label htmlFor="distributor">Status</Label>
                  <Popover open={open7} onOpenChange={setOpen7}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value7)?.label
                          : "Pilih Status"}
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
                                    setValue7(selectedDistributor.value);
                                  } else {
                                    setValue7("");
                                  }
                                  setOpen7(false);
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

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-left">No. Faktur</TableHead>
                    <TableHead className="text-left">Member</TableHead>
                    <TableHead className="text-left">Pelanggan</TableHead>
                    <TableHead className="text-left">Operator</TableHead>
                    <TableHead className="text-left">Kode</TableHead>
                    <TableHead className="text-left">Jumlah Barang</TableHead>
                    <TableHead className="text-left">Sub Total</TableHead>
                    <TableHead className="text-left">Diskon Total</TableHead>
                    <TableHead className="text-left">Sales</TableHead>
                    <TableHead className="text-left">Netto</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.produk}</TableCell>
                      <TableCell className="text-left">{item.jumlah_pesanan}</TableCell>
                      <TableCell className="text-left"><input type="number" className='text-right w-24 bg-gray-100 rounded-sm' placeholder='0' /></TableCell>
                      <TableCell className="text-left">{item.isi_packing}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.harga_beli}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
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
            <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingReport; 