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
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors, HutangData } from '@/data/product';
import HPModal from '@/components/modal/detailHutangPiutang-modal';
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
                    <CardTitle>Piutang</CardTitle>
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
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="date">Umur Hutang</Label>
                                    <Select >
                                        <SelectTrigger className="relative w-[200px] bg-gray-100 ">
                                            <SelectValue placeholder="Umur Hutang" className='' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="asc">Terbaru</SelectItem>
                                            <SelectItem value="desc">Terlama</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="date">Status Hutang</Label>
                                    <Select>
                                        <SelectTrigger className="relative w-[200px] bg-gray-100">
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
                            <div className='flex items-end'>
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
                    
                </CardContent>
            </Card>
        </div>
    );
};

export default Piutang; 