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
import { Trash } from 'lucide-react';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

const SellingTransaction = () => {
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
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");

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
              <TambahProdukModal/>
            </DialogContent>
          </Dialog>
          <Button className='border-red-500 border bg-white text-red-500 hover:bg-red-500 hover:text-white'>Batal</Button>
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
                  {data.map((item) => (
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
                <Button className='bg-blue-500 hover:bg-blue-600'>Simpan</Button>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellingTransaction; 