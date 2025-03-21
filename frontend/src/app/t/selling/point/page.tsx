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
import { Trash } from 'lucide-react';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { setTableData, deleteRow, clearTable } from '@/store/features/tableSlicer';
import { RootState } from '@/store/store';
import { toast } from 'sonner';

const SellingPoint = () => {

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["s_poin"] || []);

  useEffect(() => {
    if (data.length === 0) {
      dispatch(
        setTableData({
          tableName: "s_poin",
          data: [],
        })
      );
    }
  }, [dispatch]);

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName: "s_poin", id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName: "s_poin" }));
    toast.error("Table berhasil dihapus!");
  };

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <div className='flex justify-between'>
        <CardHeader>
          <CardTitle>Tukar Poin</CardTitle>
        </CardHeader>
        <div className='flex items-end gap-2'>
          <Dialog>
            <DialogTrigger asChild>
              <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Tambah Produk</Button>
            </DialogTrigger>
            <DialogContent className="w-[75vw] max-h-[90vh]">
              <TambahProdukModal tableName='s_poin'/>
            </DialogContent>
          </Dialog>
          <Button onClick={handleClear} className='border-red-500 border bg-white text-red-500 hover:bg-red-500 hover:text-white'>Batal</Button>
        </div>
        </div>
        <CardContent>
          <div className="flex flex-col space-y-4">

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-left">Pelanggan</TableHead>
                    <TableHead className="text-left">Jumlah Poin</TableHead>
                    <TableHead className="text-left">Tipe Tukar Poin</TableHead>
                    <TableHead className="text-left">Nominal Tukar</TableHead>
                    <TableHead className="text-left">Voucher Belanja</TableHead>
                    <TableHead className="text-left">Kadaluarsa</TableHead>
                    <TableHead className="text-center">Sisa Poin</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableCell className="font-medium">{item.jumlah_barang}</TableCell>
                      <TableCell className="font-medium">{item.jumlah_pesanan}</TableCell>
                      <TableCell className="font-medium">{item.satuan}</TableCell>
                      <TableCell className="font-medium">{item.harga_beli}</TableCell>
                      <TableCell className="font-medium">{item.diskon_rupiah}</TableCell>
                      <TableCell className="font-medium">{item.produk}</TableCell>
                      <TableCell className="text-left"><input type="number" className='text-right w-28' placeholder='1' /></TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleDelete(item.id)} className='bg-red-500 hover:bg-red-600 size-7'>
                          <Trash></Trash>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
            <div className='flex gap-2 justify-end '>
                <Button className='bg-blue-500 hover:bg-blue-600'>Simpan</Button>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingPoint; 