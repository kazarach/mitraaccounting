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
import { CalendarIcon, Check, ChevronsUpDown, Eye, Pencil, Printer, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { setTableData, deleteRow, clearTable } from '@/store/features/tableSlicer';
import { RootState } from '@/store/store';
import { toast } from 'sonner';
import { distributors } from '@/data/product';
import DetailUseStock from '@/components/modal/detailusestock-modal';

const SellingReturn = () => {

    const data = [
        {
            id: 1,
            produk: "Produk A",
            tanggal: "2025-03-24",
            noReturn: "RT001",
            tipeBayar: "Tunai",
            total: "500.000",
            pelanggan: "John Doe",
            keterangan: "Barang rusak",
            operator: "Admin1",
            status: "Diproses"
        },
        {
            id: 2,
            produk: "Produk B",
            tanggal: "2025-03-23",
            noReturn: "RT002",
            tipeBayar: "Transfer",
            total: "300.000",
            pelanggan: "Jane Smith",
            keterangan: "Salah kirim",
            operator: "Admin2",
            status: "Selesai"
        }
    ];

    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [search, setSearch] = useState("");

    const dispatch = useDispatch();

    useEffect(() => {
        if (data.length === 0) {
            dispatch(
                setTableData({
                    tableName: "s_pesanan",
                    data: [],
                })
            );
        }
    }, [dispatch]);

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName: "s_pesanan", id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName: "s_pesanan" }));
        toast.error("Table berhasil dihapus!");
    };

    return (
        <div className="flex justify-left w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Retur Penjualan</CardTitle>
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
                                        <TableHead className="text-left">No. Return</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-left">Tipe Bayar</TableHead>
                                        <TableHead className="text-left">Total</TableHead>
                                        <TableHead className="text-left">Pelanggan</TableHead>
                                        <TableHead className="text-left">Keterangan</TableHead>
                                        <TableHead className="text-left">Operator</TableHead>
                                        <TableHead className="text-left">Status</TableHead>
                                        <TableHead className="text-center" >Action</TableHead>

                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={15} className="text-center text-gray-400 bg-gray-200">
                                                Belum menambahkan produk
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.noReturn}</TableCell>
                                                <TableCell className="">{item.tanggal}</TableCell>
                                                <TableCell className="">{item.tipeBayar}</TableCell>
                                                <TableCell className="">{item.total}</TableCell>
                                                <TableCell className="">{item.pelanggan}</TableCell>
                                                <TableCell className="">{item.keterangan}</TableCell>
                                                <TableCell className="">{item.operator}</TableCell>
                                                <TableCell className="">{item.status}</TableCell>
                                                <TableCell className=" text-center">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button className="bg-blue-500 hover:bg-blue-600 size-7 mr-1">
                                                                <Eye />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[80vw] max-h-[90vh]">
                                                            <DetailUseStock noFaktur='FTR001' />
                                                        </DialogContent>
                                                    </Dialog>
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
                        <div className='flex gap-2 justify-end '>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SellingReturn; 