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
import { CalendarIcon, Check, ChevronsUpDown, Copy, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format, setDate } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/transaction/purchasing/tp-pesanan-modal';
import TambahProdukModal from '@/components/transaction/purchasing/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors } from '@/data/product';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectDropdown } from '@/components/dropdown/distributor-dropdown';


interface TransactionRow {
    id: number;
    produk: string;
    jumlah_pesanan: number;
    isi_packing: number;
    satuan: string;
    subtotal: number;
}

interface Props {

    tableName: string;
}

const TransactionTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const data = useSelector((state: RootState) => state.table["transaksi"] || []);


    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "produk",
        },
        {
            header: "Jumlah Pesanan",
            accessorKey: "jumlah_pesanan",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
        },
        {
            header: "Jumlah Barang",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="0"
                />
            ),
        },
        {
            header: "Isi Packing",
            accessorKey: "isi_packing",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
        },
        {
            header: "Satuan",
            accessorKey: "satuan",
        },
        {
            header: "Harga Beli",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="Rp0"
                />
            ),
        },
        {
            header: "Diskon (%)",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="0%"
                />
            ),
        },
        {
            header: "Diskon (Rp)",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="Rp0"
                />
            ),
        },
        {
            header: "Diskon Nota",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="Rp0"
                />
            ),
        },
        {
            header: "Total",
            accessorFn: (row) => `Rp${row.subtotal.toLocaleString("id-ID")}`,
        },
        {
            header: "Inc. PPN",
            accessorFn: (row) => `Rp${(row.subtotal * 1.11).toLocaleString("id-ID")}`,
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-center">
                    <Button
                        onClick={() => {
                            dispatch(deleteRow({ tableName, id: row.original.id }));
                            toast.error("Produk berhasil dihapus!");
                        }}
                        className="bg-red-500 hover:bg-red-600 size-7"
                    >
                        <Trash />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        if (data.length === 0) {
            dispatch(
                setTableData({
                    tableName: "transaksi",
                    data: [],
                })
            );
        }
    }, [dispatch]);

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName: "transaksi", id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName: "transaksi" }));
        toast.error("Table berhasil dihapus!");
    };

    return (
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
                        <Label htmlFor="distributor">Distributor</Label>
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
                                        : "Select Distributor"}
                                    <ChevronsUpDown className="opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Pilih Distributor" />
                                    <CommandList>
                                        <CommandEmpty>Distributor Tidak Ditemukan.</CommandEmpty>
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
                    <div className="flex  gap-2 items-center pb-2">
                        <Checkbox id="terms" className='size-5 items-center' />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Termasuk PPN
                        </label>
                    </div>
                </div>
                <div className='flex items-end gap-2'>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Pesanan</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[80vw] max-h-[90vh]">
                            <TpModal />
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[80vw] max-h-[90vh]">
                            <TambahProdukModal tableName='transaksi' />
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>
                </div>
            </div>

            <div className="rounded-md border overflow-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-left">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-left">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center text-gray-400 bg-gray-200">
                                    Belum menambahkan produk
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-white">
                            <TableCell colSpan={9} className="text-right font-bold">
                                Total:
                            </TableCell>
                            <TableCell className="text-left font-bold">
                                Rp{(data.reduce((acc, item) => acc + item.subtotal, 0) * 1.11).toLocaleString("id-ID")}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <div className='flex justify-end gap-2 mt-4 '>
                <Button className='font-medium bg-blue-500 hover:bg-blue-600  '>Input</Button>
            </div>
        </div>

    );
};

export default TransactionTable;
