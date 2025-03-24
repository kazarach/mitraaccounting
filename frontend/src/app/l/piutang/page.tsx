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
import { CalendarIcon, Check, ChevronsUpDown, Copy, DollarSign, Eye, Search, Trash } from 'lucide-react';
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
import { distributors, HutangData } from '@/data/product';
import HPModal from '@/components/transaction/detailHutangPiutang-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Piutang = () => {
    const tableName = "piutang";
    const [date, setDate] = React.useState<Date>()
    const [search, setSearch] = useState("");
    const [umurHutang, setUmurHutang] = useState('');
    const [status, setStatus] = useState('')

    const dispatch = useDispatch();
    const data = HutangData;

    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Hutang</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col space-y-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[200px] justify-start text-left font-normal",

                                                )}
                                            >
                                                <CalendarIcon />
                                                {date ? format(date, "PPP") : <span>Tanggal</span>}
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
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <Input
                                        placeholder="Cari Pemasok"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10"
                                    />
                                </div>
                                <Select >
                                    <SelectTrigger className="relative w-[200px]">
                                        <SelectValue placeholder="Umur Hutang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="asc">Terbaru</SelectItem>
                                        <SelectItem value="desc">Terlama</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select>
                                    <SelectTrigger className="relative w-[200px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>

                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="1">Lunas</SelectItem>
                                        <SelectItem value="0">Belum Lunas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode Pelanggan</TableHead>
                                        <TableHead>Nama Pelanggan</TableHead>
                                        <TableHead className="text-left">Total Hutang</TableHead>
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
                                                <TableCell className="font-medium">{item.kodePemasok ?? "-"}</TableCell>
                                                <TableCell>{item.namaPemasok}</TableCell>
                                                <TableCell>{item.totalHutang}</TableCell>
                                                <TableCell className="text-center">

                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button className="bg-blue-500 hover:bg-blue-600 size-7">
                                                                <Eye />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[80vw] max-h-[90vh]">
                                                            <HPModal />
                                                        </DialogContent>
                                                    </Dialog>
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

export default Piutang; 