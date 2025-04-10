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
import { CalendarIcon, ChevronsUpDown, Check, Search, Eye, Trash, Printer, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { operators } from '@/data/product';
import { TipeDropdown } from '@/components/dropdown/tipe-dropdown';
import { OperatorDropdown } from '@/components/dropdown/operator-dropdown';
import { DateRange } from 'react-day-picker';

const TransferKasBank = () => {
    const [search, setSearch] = useState("");
    const [date, setDate] = React.useState<DateRange | undefined>(undefined)
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
                    <CardTitle>Kas / Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
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

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Operator</Label>
                                    <OperatorDropdown />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Tipe</Label>
                                    <TipeDropdown />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="operator">Tipe Transfer</Label>
                                    <Select value={tipeTransfer} onValueChange={setTipeTransfer}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Tipe Transfer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_out">Bank Out</SelectItem>
                                            <SelectItem value="bank_in">Bank In</SelectItem>
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

                                        <TableHead>No Transaksi</TableHead>
                                        <TableHead>Tanggal</TableHead>
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

                                                <TableCell>{item.noTrans}</TableCell>
                                                <TableCell>{item.tanggal}</TableCell>
                                                <TableCell>{item.jumlah.toLocaleString()}</TableCell>
                                                <TableCell>{item.tipeTransaksi}</TableCell>
                                                <TableCell>{item.akunAsal}</TableCell>
                                                <TableCell>{item.akunTujuan}</TableCell>
                                                <TableCell>{item.keterangan}</TableCell>
                                                <TableCell>{item.status}</TableCell>
                                                <TableCell>{item.operator}</TableCell>
                                                <TableCell className="flex gap-1">
                                                    <Button className="bg-blue-500 hover:bg-blue-600 size-7"><Printer /></Button>
                                                    <Button className="bg-yellow-500 hover:bg-yellow-600 size-7"><Pencil /></Button>
                                                    <Button className="bg-red-500 hover:bg-red-600 size-7"><Trash /></Button>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransferKasBank;
