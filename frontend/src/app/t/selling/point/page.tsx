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
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { setTableData, deleteRow, clearTable } from '@/store/features/tableSlicer';
import { RootState } from '@/store/store';
import { toast } from 'sonner';
import { DialogTitle } from '@radix-ui/react-dialog';

const SellingPoint = () => {

  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.table["s_poin"] || []);

  useEffect(() => {
    if (data.length === 0) {
      dispatch(setTableData({
        tableName: "s_poin",
        data: [
          {
            id: 1,
            produk: "Edwin",
            jumlah_barang: "Fulanah",
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
    dispatch(deleteRow({ tableName: "s_poin", id }));
    toast.error("Produk berhasil dihapus!");
  };

  const handleClear = () => {
    dispatch(clearTable({ tableName: "s_poin" }));
    toast.error("Table berhasil dihapus!");
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  return (
    <div className="flex justify-center w-full pt-4">
      <Card className="w-full mx-4">
        <div className='flex justify-between'>
        <CardHeader>
          <CardTitle>Tukar Poin</CardTitle>
        </CardHeader>
        <div className='flex items-end gap-2 mx-4'>
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
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-left">Jumlah Poin</TableHead>
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
                      <TableCell className="font-medium">{item.jumlah_poin}</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => {setSelectedItemId(item.id);
                                                setIsDialogOpen(true);
                                }} className='bg-blue-500 hover:bg-blue-600 size-7'>
                          <Eye/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogTitle>Detail Poin</DialogTitle>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Edwin</h2>
                {selectedItemId !== null && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Jumlah Poin</TableHead>
                        <TableHead>Tipe Tukar</TableHead>
                        <TableHead>Nominal Tukar</TableHead>
                        <TableHead>Kadaluarsa</TableHead>
                        <TableHead>Sisa Poin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data
                        .filter((item) => item.id === selectedItemId)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.produk}</TableCell>
                            <TableCell>{item.jumlah_poin}</TableCell>
                            <TableCell>{item.tipe_tukar}</TableCell>
                            <TableCell>{item.nominal_tukar}</TableCell>
                            <TableCell>{item.kadaluarsa}</TableCell>
                            <TableCell>{item.sisa_poin}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>

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