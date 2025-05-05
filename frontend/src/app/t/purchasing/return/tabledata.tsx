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
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors, products } from '@/data/product';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import DatePick from '@/components/dropdown-normal/datePick_dd';


export const schema = yup.object({
  tanggal: yup.date().required("Tanggal wajib diisi"),
//   produk: yup.array().of(
//     yup.object({
//       id: yup.number().required("ID produk wajib ada"),
//       name: yup.string().required("Nama produk wajib diisi"),
//       jumlah_pesanan: yup.number().required("Jumlah pesanan wajib diisi"),
//       jumlah_barang: yup.number().required("Jumlah barang wajib diisi"),
//       isi_packing: yup.number().required("Isi packing wajib diisi"),
//       satuan: yup.string().required("Satuan wajib diisi"),
//       harga_beli: yup.number().required("Harga beli wajib diisi"),
//       diskon_persen: yup.number().min(0, "Diskon tidak boleh negatif").default(0),
//       diskon_rp: yup.number().min(0, "Diskon tidak boleh negatif").default(0),
//       diskon_nota: yup.number().min(0, "Diskon tidak boleh negatif").default(0),
//       total: yup.number().required("Total wajib dihitung"),
//       total2: yup.number().required("Total2 (inc. PPN) wajib dihitung"),
//     })
//   ).min(1, "Minimal 1 produk harus dimasukkan"),
//   total: yup.number().required("Total keseluruhan wajib dihitung"),
});



interface TransactionRow {
    id: number;
    name: string;
    jumlah_pesanan: number;
    jumlah_barang: number;
    harga_beli: number;
    isi_packing: number;
    satuan: string;
    subtotal: number;
}

interface inputForm {
    tanggal: Date,
    // produk: [
    //     {
    //         id: number,
    //         name: string,
    //         jumlah_pesanan: number,
    //         jumlah_barang: number,
    //         isi_packing: number,
    //         satuan: string,
    //         harga_beli: number,
    //         diskon_persen: number,
    //         diskon_rp: number,
    //         diskon_nota: number,
    //         total: number,
    //         total2: number,
    //     }
    // ]
    // total : number
}

interface Props {
    tableName: string;
}

const ReturTransTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const data = useSelector((state: RootState) => state.table["return"] || []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
      } = useForm<inputForm>({
        resolver: yupResolver(schema),
      });

    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "name",
        },
        {
            header: "Jumlah barang",
            accessorKey: "jumlah_barang",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
        },
        {
            header: "Jumlah Return",

            cell: ({ row }) => {
                

                return (
                    <input
                        type="number"
                        
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                        placeholder="0"
                    />
                );
            },
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
            cell: ({ row }) => {
                const harga_beli = row.original.harga_beli || 0;

                return (
                    <input
                        type="number"
                        defaultValue={harga_beli}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                        placeholder="0"
                    />
                );
            },
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
                            handleDelete(row.original.id);
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
        dispatch(deleteRow({ tableName: "return", id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName: "return" }));
        toast.error("Table berhasil dihapus!");
    };

    const handleInputClick = () => {
        const inputData = {
            tanggal: date ? format(date, "yyyy-MM-dd") : null,
            // tabel: data,
        };
        console.log("Input Data:", inputData);
        toast.success("Produk berhasil diinput!");
        dispatch(clearTable({ tableName: "return" }));
    };


    return (
        
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="date">Tanggal</Label>
                        <DatePick/>
                    </div>
                </div>
                <div className='flex items-end gap-2'>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Pembelian</Button>
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
                            <TambahProdukModal tableName='return' />
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
                            <TableCell colSpan={7} className="text-right font-bold">
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
                <Button className='font-medium bg-blue-500 hover:bg-blue-600 ' onClick={handleInputClick}>Input</Button>
            </div>
        </div>

    );
};

export default ReturTransTable;
