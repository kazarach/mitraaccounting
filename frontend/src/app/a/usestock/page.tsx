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
import { CalendarIcon, Check, ChevronsUpDown, Copy, Eye, Pencil, Printer, Search, Trash } from 'lucide-react';
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
import { distributors } from '@/data/product';

const StockUse = () => {
    const tableName = "stockuse";
    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const [search, setSearch] = useState("");
    const dispatch = useDispatch();
    const data = [
        {
            id: 1,
            barcode: "8991234567890",
            kode: "BRG001",
            produk: "Tissue Magic Clean 250",
            jumlah: 10,
            satuan: "pcs",
            keterangan: "Untuk kebutuhan event A"
        },
        {
            id: 2,
            barcode: "8991234567880",
            kode: "BRG002",
            produk: "Sabun Cair BioSoft 1L",
            jumlah: 5,
            satuan: "botol",
            keterangan: "Kebutuhan harian di dapur"
        },
        {
            id: 3,
            barcode: "8991234567870",
            kode: "BRG003",
            produk: "Sapu Ijuk Super",
            jumlah: 2,
            satuan: "unit",
            keterangan: "Pengganti sapu rusak"
        }
    ];

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Arsip Pemakaian Persediaan</CardTitle>
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
                                                {date ? format(date, "PPP") : <span>Pilih Tanggal</span>}
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
                                    <Label htmlFor="distributor">Operator</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-[200px] justify-between font-normal"
                                            >
                                                {value
                                                    ? distributors.find((d) => d.value === value)?.label
                                                    : "Pilih Operator"}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search Distributor" />
                                                <CommandList>
                                                    <CommandEmpty>No Distributor found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {distributors.map((d) => (
                                                            <CommandItem
                                                                key={d.value}
                                                                value={d.label}
                                                                data-value={d.value}
                                                                onSelect={(currentLabel: string) => {
                                                                    const selectedDistributor = distributors.find((dist) => dist.label === currentLabel);
                                                                    if (selectedDistributor) {
                                                                        setValue(selectedDistributor.value);
                                                                    } else {
                                                                        setValue("");
                                                                    }
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                {d.label}
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto",
                                                                        value === d.value ? "opacity-100" : "opacity-0"
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

                            </div>

                        </div>

                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead className="text-left">Jumlah</TableHead>
                                        <TableHead className="text-left">Satuan</TableHead>
                                        <TableHead className="text-left">Keterangan</TableHead>
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
                                                <TableCell className="font-medium">{item.barcode ?? "-"}</TableCell>
                                                <TableCell className="font-medium">{item.kode ?? "-"}</TableCell>
                                                <TableCell>{item.produk}</TableCell>
                                                <TableCell>{item.jumlah}</TableCell>
                                                <TableCell>{item.satuan}</TableCell>
                                                <TableCell>{item.keterangan}</TableCell>

                                                <TableCell className="text-center">
                                                    <Button className='bg-blue-500 hover:bg-blue-600 size-7 mr-1'>
                                                        <Eye />
                                                    </Button>
                                                    <Button className='bg-yellow-500 hover:bg-yellow-600 size-7 mr-1'>
                                                        <Pencil />
                                                    </Button>
                                                    <Button className='bg-blue-500 hover:bg-blue-600 size-7 mr-1'>
                                                        <Printer />
                                                    </Button>
                                                    <Button className='bg-red-500 hover:bg-red-600 size-7 mr-1' >
                                                        <Trash />
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

export default StockUse; 