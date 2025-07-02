"use client"

import React from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell
} from "@/components/ui/table"
import { format } from "date-fns"
import { toast } from 'sonner';
import { mutate } from 'swr';

export function TukarPointModal({
    open,
    onClose,
    transaction
  }: {
    open: boolean
    onClose: (open: boolean) => void
    transaction: any  // isi transaksi lengkap, termasuk items, tanggal, dsb
  }) {
    const [redeemPoint, setRedeemPoint] = React.useState<number>(0);
    const [addPoint, setAddPoint] = React.useState<number>(0);
    const [note, setNote] = React.useState<string>("");

    const handleSubmit = async () => {
    const token = localStorage.getItem("access");
    const API_URL = process.env.NEXT_PUBLIC_API_URL!;
    const customerId = transaction?.id;
    const expiryDate = transaction?.duedate;

  try {
    if (addPoint > 0) {
      const res = await fetch(`${API_URL}api/point-transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer: customerId,
          points: addPoint.toString(),
          transaction_type: "EARNED",
          note
          // expiry_date: expiryDate,
        }),
      });

      const result = await res.json();
      console.log("🟢 Response EARNED:", result);

      if (!res.ok) throw new Error(`EARNED failed: ${res.status} ${res.statusText}`);
    }

    if (redeemPoint < 0) {
      const res = await fetch(`${API_URL}api/point-transactions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer: customerId,
          points: redeemPoint.toString(),
          transaction_type: "REDEEMED",
          note
          // expiry_date: expiryDate,
        }),
      });

      const result = await res.json();
      console.log("🟠 Response REDEEMED:", result);

      if (!res.ok) throw new Error(`REDEEMED failed: ${res.status} ${res.statusText}`);
    }

    toast.success("Poin berhasil dikirim.");
    onClose(false);
    mutate(`${API_URL}api/customers/`);
  } catch (error) {
    console.error("❌ Gagal mengirim poin:", error);
    toast.error("Terjadi kesalahan saat mengirim poin.");
  }
};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" min-w-[30vw]"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className=" flex flex-col " >
            <DialogHeader>
                <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
                    Detail Tukar Poin
                </DialogTitle>
            </DialogHeader>

            <div className="flex  gap-4 mb-3 ">
                <div className="flex flex-col gap-2 justify-between w-full">
                    <div className="flex justify-between" >
                    </div>


                </div>
            </div>
            <div className='border rounded-md overflow-auto mb-2 '>
                <Table  >
                    <TableHeader>
                        <TableRow className='font-semibold'>
                            <TableCell className='border-r'>Nama Pelanggan</TableCell>
                            <TableCell>
                                {transaction?.name}
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <TableRow >
                            <TableCell className='border-r' >Alamat</TableCell>
                            <TableCell className='text-left'>
                                {transaction?.address}
                            </TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>Kadaluarsa</TableCell>
                            <TableCell className='text-left'>
                                {format(new Date(transaction.duedate), "dd/MM/yyyy")}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jumlah Poin</TableCell>
                            <TableCell className="text-right border-l">
                                {transaction?.point}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r font-semibold'>(+) Tambah Poin</TableCell>
                            <TableCell className="text-left border-l p-0">
                                <Input
                                type="text"
                                inputMode="numeric"
                                value={addPoint === 0 ? "" : addPoint.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                onChange={(e) => {
                                const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                                const numeric = parseInt(raw || "0", 10);
                                setAddPoint(numeric);
                                }}
                                placeholder='0'
                                className="bg-green-100 border-0 m-0 p-2 rounded-none text-left"
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                        <TableCell className='font-semibold'>(-) Tukar Poin</TableCell>
                        <TableCell className="text-left border-l p-0">
                            <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={
                                redeemPoint === 0
                                ? ""
                                : `-${Math.abs(redeemPoint).toLocaleString("id-ID", { maximumFractionDigits: 2 })}` // format 1.000 dst
                            }
                            onChange={(e) => {
                                const raw = e.target.value
                                .replace(/\./g, "") // hapus titik
                                .replace(/[^0-9]/g, ""); // sisakan angka
                                const numeric = parseInt(raw || "0", 10);
                                setRedeemPoint(-Math.abs(numeric)); // selalu negatif
                            }}
                            className="bg-red-100 border-0 m-0 p-2 rounded-none text-left"
                            />
                        </TableCell>
                        </TableRow>

                        
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Note</TableCell>
                            <TableCell className='text-left border-l p-0'>
                              <Input
                              value={note}  // Menghubungkan dengan state 'note'
                              onChange={(e) => setNote(e.target.value)}  // Update state saat ada perubahan
                              className="border-0 m-0 p-2 rounded-none text-leftt"
                              placeholder="Masukkan note"
                            />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Tipe Tukar Poin</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                            <Select>
                                <SelectTrigger className="relative w-full bg-white text-sm border-0 rounded-none">
                                    <SelectValue placeholder="Pilih Tukar Poin" className='text-sm' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VOUCHER">Voucher</SelectItem>
                                    <SelectItem value="BANK">Transfer Bank</SelectItem>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                </SelectContent>
                            </Select>
                            </TableCell>
                        </TableRow>
                        
                        <TableRow>
                            <TableCell className='font-semibold'>Poin Sebelum</TableCell>
                            <TableCell className="text-right border-l font-bold">
                                {transaction?.point}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className='font-semibold bg-gray-100'>Poin Sesudah</TableCell>
                            <TableCell className="text-right border-l font-bold bg-gray-100">
                                {(parseFloat(transaction?.point ?? "0") + redeemPoint + addPoint).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    </TableBody>

                </Table>
            </div>
            <div className="flex justify-end mb-0 pb-0">
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleSubmit}>Simpan</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
