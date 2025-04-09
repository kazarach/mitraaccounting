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
import { CalendarIcon, Check, ChevronsUpDown, Search, Trash, Eye } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { setTableData, deleteRow, clearTable } from '@/store/features/tableSlicer';
import { RootState } from '@/store/store';
import { toast } from 'sonner';

const PurchaseReturnArchive = () => {

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

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["s_pesanan"] || []);

  useEffect(() => {
          if (data.length === 0) {
            dispatch(setTableData({
              tableName: "s_pesanan",
              data: [
                {
                  id: 1,
                  produk: "Edwin",
                  jumlah_barang: 12345,
                  sales: "Zaenudin",
                  jumlah_poin: 300,
                  sisa_poin: 100,
                  tipe_tukar: "Cash",
                  satuan: "Poin",
                  nominal_tukar: "Rp 30.000",
                  kadaluarsa: "19 January 2025",
                }
              ]
            }));
          }
        }, [dispatch]);

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName: "s_pesanan", id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName: "s_pesanan" }));
    toast.error("Table berhasil dihapus!");
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Arsip Retur Pembelian</CardTitle>
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
                  <Label htmlFor="distributor">Distributor</Label>
                  <Popover open={open2} onOpenChange={setOpen2}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value2)?.label
                          : "Pilih Distributor"}
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
                                    setValue2(selectedDistributor.value);
                                  } else {
                                    setValue2("");
                                  }
                                  setOpen2(false);
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
              
              <div className='flex flex-col gap-2'>
              <div className='flex items-end gap-2'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Tambah Produk</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[75vw] max-h-[90vh]">
                    <TambahProdukModal tableName='s_pesanan'/>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleClear} className='border-red-500 border bg-white text-red-500 hover:bg-red-500 hover:text-white'>Batal</Button>
                </div>
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
                    <TableHead>No.</TableHead>
                    <TableHead className="text-left">Tanggal</TableHead>
                    <TableHead className="text-left">No. Retur</TableHead>
                    <TableHead className="text-left">Tipe Bayar</TableHead>
                    <TableHead className="text-left">Total</TableHead>
                    <TableHead className="text-left">Distributor</TableHead>
                    <TableHead className="text-left">Faktur Pembelian</TableHead>
                    <TableHead className="text-left">Operator</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.produk}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left"><input type="number" className='text-right w-24 bg-gray-100 rounded-sm' placeholder='0' /></TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-left">{item.satuan}</TableCell>
                      <TableCell className="text-right">
                      <Button onClick={() => {setSelectedItemId(item.id);
                                                setIsDialogOpen(true);
                                }} className='bg-blue-500 hover:bg-blue-600 size-7'>
                          <Eye/>
                        </Button>
                      </TableCell>           
                    </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogTitle>Detail Arsip Retur Pembelian</DialogTitle>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Edwin</h2>
                {selectedItemId !== null && (
                  <Table>
                    <TableHeader>
                    <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead className="text-left">Tanggal</TableHead>
                    <TableHead className="text-left">No. Retur</TableHead>
                    <TableHead className="text-left">Tipe Bayar</TableHead>
                    <TableHead className="text-left">Total</TableHead>
                    <TableHead className="text-left">Distributor</TableHead>
                    <TableHead className="text-left">Faktur Pembelian</TableHead>
                    <TableHead className="text-left">Operator</TableHead>
                    <TableHead className="text-left">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data
                        .filter((item) => item.id === selectedItemId)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.produk}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left"><input type="number" className='text-right w-24 bg-gray-100 rounded-sm' placeholder='0' /></TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                            <TableCell className="text-left">{item.satuan}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className='flex gap-2 justify-end '>
              <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
            </div>
            </DialogContent>
          </Dialog>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseReturnArchive; 