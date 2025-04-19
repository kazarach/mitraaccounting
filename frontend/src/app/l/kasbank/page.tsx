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
import { CalendarIcon, Check, ChevronsUpDown, Copy, DollarSign, Eye, Printer, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { distributors, operators, poinMemberPelanggan } from '@/data/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { OperatorDropdown } from '@/components/dropdown-checkbox/operator-dropdown';
import { TipeDropdown } from '@/components/dropdown-checkbox/tipe-dropdown';
import { DateRange } from 'react-day-picker';


const kasbank = () => {
    const tableName = "hutang";

    const [search, setSearch] = useState("");
    const [umurHutang, setUmurHutang] = useState('');
    const [status, setStatus] = useState('')
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [open2, setOpen2] = React.useState(false)
    const [value2, setValue2] = React.useState("")
    const [open3, setOpen3] = React.useState(false)
    const [value3, setValue3] = React.useState("")
    const [date, setDate] = React.useState<DateRange | undefined>(undefined)
    const dispatch = useDispatch();
    const dummyData = [
        {
            id: 1,
            tanggal: '2025-03-24',
            noFaktur: 'INV-001',
            keterangan: 'Pembayaran customer',
            masuk: 1000000,
            keluar: 0,
            total: 1000000,
            tipe: 'Kas',
            operator: 'Admin1'
        },
        {
            id: 2,
            tanggal: '2025-03-24',
            noFaktur: 'INV-002',
            keterangan: 'Pembelian barang',
            masuk: 0,
            keluar: 500000,
            total: -500000,
            tipe: 'Bank',
            operator: 'Admin2'
        },
    ];

    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Kas / Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
                                
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Operator</Label>
                                    <OperatorDropdown />
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Tipe</Label>
                                    <TipeDropdown />
                                </div>
                                <div className="flex flex-col space-y-2" >
                                    <Label htmlFor="date">Tanggal</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-56 justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon />
                                                {date?.from ? (
                                                    date.to ? (
                                                        <>
                                                            {format(date.from, "LLL dd, y")} -{" "}
                                                            {format(date.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(date.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pilih Tanggal</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={date}
                                                onSelect={setDate}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                        <input type="text" placeholder="Cari Faktur" style={{ border: 'none', outline: 'none', flex: '1' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-left">No Faktur</TableHead>
                                        <TableHead className="text-left">Tanggal</TableHead>
                                        <TableHead className="text-left">Keterangan</TableHead>
                                        <TableHead className="text-right">Masuk</TableHead>
                                        <TableHead className="text-right">Keluar</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-left">Tipe</TableHead>
                                        <TableHead className="text-left">Operator</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dummyData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-gray-400 bg-gray-100">
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dummyData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.noFaktur}</TableCell>
                                                <TableCell>{item.tanggal}</TableCell>
                                                <TableCell>{item.keterangan}</TableCell>
                                                <TableCell className="text-right">{item.masuk.toLocaleString('id-ID')}</TableCell>
                                                <TableCell className="text-right">{item.keluar.toLocaleString('id-ID')}</TableCell>
                                                <TableCell className="text-right">{item.total.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>{item.tipe}</TableCell>
                                                <TableCell>{item.operator}</TableCell>
                                                <TableCell>
                                                    <Button className="bg-blue-500 hover:bg-blue-600 size-7">
                                                        <Printer />
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



                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default kasbank; 