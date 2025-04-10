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
import { CalendarIcon, Check, ChevronsUpDown, Copy, DollarSign, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors } from '@/data/product';

const ReturnPurchase = () => {
  const [date, setDate] = React.useState<Date>()
  const [search, setSearch] = useState("");


  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["return"] || []);

  useEffect(() => {
    if (data.length === 0) {
      dispatch(
        setTableData({
          tableName: "return",
          data: [],
        })
      );
    }
  }, [dispatch]);

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName: "return", id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName: "return" }));
    toast.error("Table berhasil dihapus!");
  };

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Return Pembelian</CardTitle>
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
                <div className=" relative w-[200px]">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Nominal"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className='flex items-end gap-2'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Transaksi</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[80vw] max-h-[90vh]">
                    <TpModal />
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[80vw] max-h-[90vh]">
                    <TambahProdukModal tableName='return' />
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
                    <TableHead className="text-left">Jumlah barang</TableHead>
                    <TableHead className="text-left">Jumlah Return</TableHead>
                    <TableHead className="text-left">Isi Packing</TableHead>
                    <TableHead className="text-left">Satuan</TableHead>
                    <TableHead className="text-left">Harga Beli</TableHead>
                    <TableHead className="text-left">Total</TableHead>
                    <TableHead className="text-left">Inc. PPN</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-400 bg-gray-200">
                        Belum menambahkan produk
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.produk}</TableCell>
                        <TableCell className="text-left">0</TableCell>
                        <TableCell className="text-left"><input type="number" className='pl-1 text-left w-24 bg-gray-100 rounded-sm' placeholder='0' /></TableCell>
                        <TableCell className="text-left">{item.isi_packing}</TableCell>
                        <TableCell className="text-left">{item.satuan}</TableCell>
                        <TableCell className="text-left"><input type="number" className='pl-1 text-left w-24 bg-gray-100 rounded-sm' placeholder='Rp0' /></TableCell>
                        <TableCell className="text-left">Rp{item.subtotal.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-left">Rp{(item.subtotal * 1.11).toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-center">
                          <Button onClick={() => handleDelete(item.id)} className='bg-red-500 hover:bg-red-600 size-7'>
                            <Trash></Trash>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

                <TableFooter>
                  <TableRow className='bg-white'>
                    <TableCell colSpan={9} className="text-right font-bold">Total:</TableCell>
                    <TableCell className="text-left font-bold">Rp{data.reduce((acc, item) => (acc + item.subtotal) * 1.11, 0).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-4 '>

            <Button onClick={() => toast.success("Return Pembelian Berhasil")} className='font-medium bg-blue-500 hover:bg-blue-600  '>Input</Button>

          </div>
        </CardContent>
      </Card>
    </div >
  );
};

export default ReturnPurchase; 