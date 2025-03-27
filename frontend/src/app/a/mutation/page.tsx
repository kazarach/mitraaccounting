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
import { CalendarIcon, Check, ChevronsUpDown, Copy, DollarSign, Eye, Pencil, Printer, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/transaction/purchasing/tp-pesanan-modal';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { distributors, operators, poinMemberPelanggan } from '@/data/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


const mutation = () => {
    const tableName = "hutang";
    const [date, setDate] = React.useState<Date>()
    const [search, setSearch] = useState("");
    const [umurHutang, setUmurHutang] = useState('');
    const [status, setStatus] = useState('')
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [open2, setOpen2] = React.useState(false)
    const [value2, setValue2] = React.useState("")
    const [open3, setOpen3] = React.useState(false)
    const [value3, setValue3] = React.useState("")

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
                    <CardTitle>Mutasi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="distributor">Cari Faktur</Label>
                                    <div className=" relative w-[200px]">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <Input
                                            placeholder="Cari Faktur"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Operator</Label>
                                    <Popover open={open2} onOpenChange={setOpen2}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open2}
                                                className="w-[200px] justify-between font-normal"
                                            >
                                                {value2
                                                    ? operators.find((d) => d.id === value2)?.name
                                                    : "Select Operator"}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search Operator" />
                                                <CommandList>
                                                    <CommandEmpty>No Operator found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {operators.map((d) => (
                                                            <CommandItem
                                                                key={d.id}
                                                                value={d.name}
                                                                data-value={d.id}
                                                                onSelect={(currentLabel: string) => {
                                                                    const selectedOperator = operators.find((operator) => operator.name === currentLabel);
                                                                    if (selectedOperator) {
                                                                        setValue2(selectedOperator.id);
                                                                    } else {
                                                                        setValue2("");
                                                                    }
                                                                    setOpen2(false);
                                                                }}
                                                            >
                                                                {d.name}
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto",
                                                                        value2 === d.id ? "opacity-100" : "opacity-0"
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
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Tipe</Label>
                                    <Select >
                                        <SelectTrigger className="relative w-[200px]">
                                            <SelectValue placeholder="Semua" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="asc">Kas</SelectItem>
                                            <SelectItem value="desc">Bank</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                        </div>

                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-left">No Faktur</TableHead>
                                        <TableHead className="text-left">Tanggal</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-left">Keterangan</TableHead>
                                        <TableHead className="text-left">Operator</TableHead>
                                        <TableHead className='text-center'>Action</TableHead>
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
                                                <TableCell>{item.total.toLocaleString()}</TableCell>
                                                <TableCell>{item.keterangan}</TableCell>
                                                <TableCell>{item.operator}</TableCell>
                                                <TableCell className='text-center'>
                                                <Button className='bg-blue-500 hover:bg-blue-600 size-7 mr-1'>
                                                        <Eye/>
                                                    </Button>
                                                    <Button className='bg-yellow-500 hover:bg-yellow-600 size-7 mr-1'>
                                                        <Pencil/>
                                                    </Button>
                                                    <Button className='bg-blue-500 hover:bg-blue-600 size-7 mr-1'>
                                                        <Printer/>
                                                    </Button>
                                                    <Button className='bg-red-500 hover:bg-red-600 size-7 mr-1' >
                                                        <Trash/>
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

export default mutation; 