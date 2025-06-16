
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
import { cn, fetcher, fetcherPost } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Copy, Trash } from 'lucide-react';
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
import { distributors } from '@/data/product';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';


interface Props {
    tableName: string;
}

interface ProductRow {
    id: number;
    barcode: string;
    stock_name: string;
    quantity: number;
    unit: string;
    keterangan?: string;
}

const StockUses: React.FC<Props> = ({ tableName }) => {


    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = useState<Date>(new Date());
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    const dispatch = useDispatch();
    const data = useSelector((state: RootState) => state.table[tableName] || []);
    useEffect(() => {
        if (data.length === 0) {
            dispatch(
                setTableData({
                    tableName,
                    data: [],
                })
            );
        }
    }, [dispatch]);




    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    const columns: ColumnDef<any>[] = [
        {
            header: "Barcode",
            accessorKey: "barcode",
            size: 150
        },
        {
            header: "Produk",
            accessorKey: "stock_name",
            size: 300
        },
        {
            header: "Jumlah barang",
            accessorKey: "quantity",
            cell: ({ row }) => (
                <input
                    type="number"
                    min={1}
                    className="w-full px-2 py-1 m-0 bg-gray-100"
                    defaultValue={row.original.quantity}
                    onBlur={(e) => {
                        // Dispatch redux/set state/etc.
                        const newQuantity = Number(e.target.value);
                        dispatch(setTableData({
                            tableName,
                            data: data.map(item =>
                                item.id === row.original.id ? { ...item, quantity: newQuantity } : item
                            )
                        }));
                    }}
                />
            ),
        },
        { header: "Satuan", accessorKey: "unit", size: 60 },
        {
            header: "Keterangan",
            cell: ({ row }) => (
                <input
                    type="text"
                    className="w-full px-2 py-1 m-0 bg-gray-100"
                />
            ),
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

    const API_URL = process.env.NEXT_PUBLIC_API_URL!;

    const { trigger, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `${API_URL}api/transactions/`,
        fetcherPost
    );

    const { data: me, error, isLoading, mutate } = useSWR(`${API_URL}api/users/me/`, fetcher);

    const onSubmit = async () => {
        const payload = {
            th_type: "USAGE",
            cashier: me.id,
            th_date: date.toISOString() || "",
            th_note: "",
            th_payment_type: "CASH",
            items: data.map(item => ({
                stock: item.stock,
                stock_code: item.stock_code || "",
                stock_name: item.stock_name,
                stock_price_buy: item.stock_price_buy,
                quantity: 0,
                disc: item.disc || 0,
                disc_percent: item.disc_percent || 0,
                disc_percent2: item.disc_percent2 || 0,
            }))
        };
        console.log(JSON.stringify(payload, null, 1));
        trigger(payload)
            .then((res) => {
                toast.success("Pemakaian Berhasil Disimpan");
                dispatch(clearTable({ tableName }));
                console.log(res);
            })
            .catch((err) => {
                toast.error(err.message);
            });
    };

    return (
        <div className="flex flex-col space-y-4">
            <div>
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
                                        onSelect={val => setDate(val ?? date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className='flex items-end gap-2'>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                            </DialogTrigger>
                            <DialogContent className="w-[100vw] max-h-[90vh]">
                                <TambahProdukModal tableName={tableName} />
                            </DialogContent>
                        </Dialog>

                        <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>
                    </div>
                </div>

                <div className="rounded-md border overflow-auto">
                    <Table>
                        <TableHeader className="bg-gray-100 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="relative h-[40px]">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            style={{
                                                position: "absolute",
                                                left: header.getStart(),
                                                width: header.getSize(),
                                            }}
                                            className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100 overflow-hidden whitespace-nowrap"
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}

                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-300"
                                                    style={{ transform: "translateX(50%)" }}
                                                />
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="relative h-[40px]">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                style={{
                                                    position: "absolute",
                                                    left: cell.column.getStart(),
                                                    width: cell.column.getSize(),
                                                    height: "100%",
                                                }}
                                                className="text-left p-2 border-b border-r last:border-r-0 whitespace-nowrap overflow-hidden"
                                            >
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
                        <TableFooter className="sticky bg-gray-100 bottom-0 z-10 border-2">
                            <TableRow className="relative h-[40px]">
                                {table.getHeaderGroups()[0].headers.map((header, index) => {
                                    const column = header.column;
                                    let content: React.ReactNode = "";
                                    switch (index) {
                                        case 1:
                                            content = "Total Barang:";
                                            break;
                                        case 2:
                                            content = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
                                            break;
                                    }

                                    return (
                                        <TableCell
                                            key={column.id}
                                            style={{
                                                position: "absolute",
                                                left: column.getStart(),
                                                width: column.getSize(),
                                                height: "100%",
                                            }}
                                            className="text-left font-bold border-b border-r last:border-r-0 whitespace-nowrap p-2 bg-gray-100"
                                        >
                                            {content}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
            <div className='flex justify-end gap-2 mt-4 '>


                <Dialog >
                    {data.length > 0 ? (
                        <DialogTrigger>
                            <Button className='font-medium bg-blue-500 hover:bg-blue-600' >Simpan</Button>
                        </DialogTrigger>
                    ) : (
                        <Button
                            className='font-medium bg-blue-500 hover:bg-blue-600'
                            onClick={() => toast.error("Silakan tambahkan produk terlebih dahulu")}
                        >
                            Simpan
                        </Button>
                    )}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi</DialogTitle>
                            <DialogDescription>
                            </DialogDescription>
                            <div className='w-2/3'>
                                <p className='text-sm text-gray-500'>Pastikan semua informasi yang dimasukkan sudah benar sebelum melanjutkan</p>
                            </div>
                            <div className='flex justify-end gap-2 mt-6'>
                                <DialogClose asChild>
                                    <Button className='font-medium border bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'>
                                        Batal
                                    </Button>
                                </DialogClose>
                                <DialogClose>
                                <Button className='font-medium bg-blue-500 hover:bg-blue-600 ' onClick={onSubmit}>Simpan</Button>
                                </DialogClose>
                            </div>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>

        </div>
    );
};

export default StockUses; 