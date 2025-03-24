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
import { CalendarIcon, Check, ChevronsUpDown, Copy, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/transaction/purchasing/tp-pesanan-modal';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors } from '@/data/product';

const StockUse = () => {
  const tableName = "stockuse";
  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [date, setDate] = React.useState<Date>()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table[tableName] || []);

  useEffect(() => {
    if (data.length === 0) {
      dispatch(
        setTableData({
          tableName,
          data: [],
        })
      );
    }
  }, [dispatch]);

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName, id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName }));
    toast.error("Table berhasil dihapus!");
  };

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Opname Persediaan</CardTitle>
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
              </div>
              <div className='flex items-end gap-2'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[80vw] max-h-[90vh]">
                    <TambahProdukModal tableName={tableName} />
                  </DialogContent>
                </Dialog>

                <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>
              </div>
            </div>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-left">Jumlah</TableHead>
                    <TableHead className="text-left">Satuan</TableHead>
                    <TableHead className="text-left">Keterangan</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 bg-gray-200">
                        Belum menambahkan produk
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.barcode ?? "-"}</TableCell>
                        <TableCell>{item.produk}</TableCell>
                        <TableCell className="text-left">
                          <input
                            type="number"
                            defaultValue={item.jumlah ?? 0}
                            className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-left">
                          <input
                            type="text"
                            defaultValue={item.satuan ?? ""}
                            className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                            placeholder="Satuan"
                          />
                        </TableCell>
                        <TableCell className="text-left">
                          <input
                            type="text"
                            defaultValue={item.keterangan ?? ""}
                            className="pl-1 text-left w-full bg-gray-100 rounded-sm"
                            placeholder="Keterangan (optional)"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-600 size-7">
                            <Trash />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-4 '>

            <Button onClick={() => toast.success("Transaksi Berhasil Ditambahkan  ")} className='font-medium bg-blue-500 hover:bg-blue-600  '>Input Pemakaian</Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockUse; 