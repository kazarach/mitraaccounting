"use client";
import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableFooter, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import DatePick from '@/components/dropdown-normal/datePick_dd';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import PembelianModal from './pembelianModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Trash } from 'lucide-react';

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

interface Props {
    tableName: string;
}

const ReturTransTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = useState<Date>();
    const data: TransactionRow[] = useSelector((state: RootState) => state.table[tableName] || []);

    const columns: ColumnDef<TransactionRow>[] = [
        { header: "Produk", accessorKey: "stock_name" },
        { header: "Jumlah barang", accessorKey: "quantity" },
        {
            header: "Jumlah Return",
            cell: ({ row }) => {
                return (
                    <input
                        type="number"

                        className="pl-1 text-left bg-gray-100 rounded-sm w-24"
                    />
                );
            },
            size: 80
        },
        {
            header: "Satuan",
            accessorKey: "unit",
            size: 80,
        },
        {
            header: "Jns Packing",
            accessorKey: "conversion_unit",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
            size: 110
        },
        { header: "Harga Beli", accessorKey: "stock_price_buy" },
        {
            header: "Total",
            accessorFn: (row) => `Rp${(row.subtotal ?? 0).toLocaleString("id-ID")}`,
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <Button
                    onClick={() => handleDelete(row.original.id)}
                    className="bg-red-500 hover:bg-red-600 size-7"
                >
                    <Trash />
                </Button>
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
            dispatch(setTableData({
                tableName,
                data: [],
            }));
        }
    }, [dispatch, data.length, tableName]);

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    const handleInputClick = () => {
        toast.success("Produk berhasil diinput!");
        dispatch(clearTable({ tableName }));
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="date">Tanggal</Label>
                        <DatePick />
                    </div>
                </div>
                <div className='flex items-end gap-2'>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Pembelian</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[80vw] max-h-[90vh]">
                            <PembelianModal tableName={tableName} />
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[80vw] max-h-[90vh]">
                            <TambahProdukModal tableName={tableName} />
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
                            <TableCell colSpan={6} className="text-right font-bold">
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


