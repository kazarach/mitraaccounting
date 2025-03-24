"use client";
import React, { useEffect, useState } from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
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
import { CalendarIcon, Check, ChevronsUpDown, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { useDispatch, useSelector } from 'react-redux';
import { distributors } from '@/data/product';
import { clearTable, deleteRow, setTableData } from '@/store/features/tableSlicer';
import { RootState } from '@/store/store';
import { toast } from 'sonner';

const TransactionPurchase = () => {

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["pesanan"] || []);

  useEffect(() => {
    if (data.length === 0) {
      dispatch(
        setTableData({
          tableName: "pesanan",
          data: [],
        })
      );
    }
  }, [dispatch]);

  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [date, setDate] = React.useState<Date>()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName: "pesanan", id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName: "pesanan" }));
    toast.error("Table berhasil dihapus!");
  };

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Pesanan Pembelian</CardTitle>
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
                          "w-[200px] justify-start text-left font-normal",

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
                          : "Select Distributor"}
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
              </div>
              <div className='flex items-end gap-2'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[80vw] max-h-[90vh]">
                    <TambahProdukModal tableName='pesanan' />
                  </DialogContent>
                </Dialog>
                <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>
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
                        <Button onClick={() => handleDelete(item.id)} className='bg-red-500 hover:bg-red-600 size-7'>
                          <Trash></Trash>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className='bg-white'>
                    <TableCell colSpan={9} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-Left font-bold">Rp{data.reduce((acc, item) => (acc + item.subtotal) * 1.11, 0).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-4 '>
            <Button className='font-medium bg-blue-500 hover:bg-blue-600  '>Tambah Transaksi</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionPurchase; 