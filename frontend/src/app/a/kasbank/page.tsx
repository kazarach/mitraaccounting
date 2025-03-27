"use client";
import React, { useEffect, useState } from 'react';

import {
    Table,
    TableBody,
    TableCell,
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
import { CalendarIcon, ChevronsUpDown, Check, Search, Eye, Trash, Printer } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { operators } from '@/data/product';

const TransferKasBank = () => {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState<Date>();
    const [operator, setOperator] = useState("");
    const [tipe, setTipe] = useState("");
    const [tipeTransfer, setTipeTransfer] = useState("");
    const [includePiutang, setIncludePiutang] = useState(false);
    const [open2, setOpen2] = React.useState(false)
    const [value2, setValue2] = React.useState("")

    const dummyData = [
        {
            id: 1,
            tanggal: '2025-03-24',
            noTrans: 'TRF-001',
            jumlah: 2500000,
            tipeTransaksi: 'Antar Bank',
            akunAsal: 'Bank Mandiri',
            akunTujuan: 'Bank BCA',
            keterangan: 'Pemindahan dana operasional',
            status: 'Selesai',
            operator: 'Admin1'
        },
        {
            id: 2,
            tanggal: '2025-03-25',
            noTrans: 'TRF-002',
            jumlah: 1000000,
            tipeTransaksi: 'Bank Out',
            akunAsal: 'Kas Kecil',
            akunTujuan: 'Bank BNI',
            keterangan: 'Setor ke rekening perusahaan',
            status: 'Diproses',
            operator: 'Admin2'
        }
    ];

    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Transfer Antar Kas / Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4 mb-4">
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

                        <Select value={tipe} onValueChange={setTipe}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tipe (Antar Bank / Kas dll)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="antar_bank">Antar Bank</SelectItem>
                                <SelectItem value="antar_kas">Antar Kas</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tipeTransfer} onValueChange={setTipeTransfer}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tipe Transfer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank_out">Bank Out</SelectItem>
                                <SelectItem value="bank_in">Bank In</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Cari..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10"
                            />
                        </div>


                    </div>

                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>No Trans</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Tipe Transaksi</TableHead>
                                    <TableHead>Akun Asal</TableHead>
                                    <TableHead>Akun Tujuan</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dummyData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="text-center text-gray-400 bg-gray-100">
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dummyData.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.tanggal}</TableCell>
                                            <TableCell>{item.noTrans}</TableCell>
                                            <TableCell>{item.jumlah.toLocaleString()}</TableCell>
                                            <TableCell>{item.tipeTransaksi}</TableCell>
                                            <TableCell>{item.akunAsal}</TableCell>
                                            <TableCell>{item.akunTujuan}</TableCell>
                                            <TableCell>{item.keterangan}</TableCell>
                                            <TableCell>{item.status}</TableCell>
                                            <TableCell>{item.operator}</TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button className="bg-blue-500 hover:bg-blue-600 size-7"><Eye /></Button>
                                                <Button className="bg-yellow-500 hover:bg-yellow-600 size-7"><Trash /></Button>
                                                <Button className="bg-red-500 hover:bg-red-600 size-7"><Printer /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button className="bg-blue-500 hover:bg-blue-600">Search</Button>
                        <Button className="bg-gray-500 hover:bg-gray-600">Cancel</Button>
                        <Button className="bg-orange-500 hover:bg-orange-600">Koreksi</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransferKasBank;
