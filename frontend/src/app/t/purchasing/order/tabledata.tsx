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
import DistributorDD from '@/components/dropdown-normal/distributor_dd';
import DatePick from '@/components/dropdown-normal/datePick_dd';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { id } from 'date-fns/locale';


const formSchema = z.object({
    th_date: z.string({
        required_error: "Pilih Tanggal!"
    }).datetime({ message: "Pilih Tanggal!" }),
    supplier: z.number({
        required_error: "Pilih Supplier!"
    }),
    th_disc: z.number({
        required_error: "Masukkan Diskon Nota"
    }),
    // items: z.array(z.object({
    //     stock: z.number(),
    //     quantity: z.number(),
    //     stock_price_buy: z.number(),
    //     unit: z.number(),
    //     disc: z.number(),
    //     total: z.string(),
    //     netto: z.number(),
    // }))
})




interface Props {
    tableName: string;
}

const OrderTransTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<Date>()
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [distributor, setDistributor] = useState<number | null>(null);
    const data = useSelector((state: RootState) => state.table["order"] || []);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            supplier: undefined,
            th_disc: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        toast.success("Form berhasil disubmit!")
        console.log(values)
        dispatch(clearTable({ tableName }));
    }

    const columns: ColumnDef<any>[] = [
        {
            header: "Produk",
            accessorKey: "stock_name",
        },
        {
                    header: "Barang",
        
                    cell: ({ row }) => {
                        const jumlahBarang = row.original.quantity || 0;
        
                        return (
                            <input
                                type="number"
                                defaultValue={jumlahBarang}
                                onBlur={(e) => handleChange(e, row.original.id, 'quantity')}
                                className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                                placeholder="0"
                            />
                        );
                    },
                },
        {
            header: "Satuan",
            accessorKey: "unit",
        },
        {
            header: "Jns Packing",
            accessorKey: "conversion_unit",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
        },
        {
            header: "Harga Beli Terakhir",
            accessorKey: "stock_price_buy",
        },
        {
            header: "Total",
            cell: ({ row }) => {
                const harga = row.original.stock_price_buy || 0;
                const quantity = row.original.quantity || 0;
                const subtotal = harga * quantity;
                return (
                    <div className="">Rp{subtotal.toLocaleString("id-ID")}</div>
                );
            },
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
                    tableName: "order",
                    data: [],
                })
            );
        }
    }, [dispatch]);

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName: "order", id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowId: number, field: string) => {
            const value = parseFloat(e.target.value) || 0;
    
            const updatedData = data.map((item) => {
                if (item.id === rowId) {
                    const updatedItem = { ...item };
    
                    if (field === 'quantity') {
                        updatedItem.quantity = value;
                    } else if (field === 'stock_price_buy') {
                        updatedItem.stock_price_buy = value;
                    }
    
                    updatedItem.subtotal = updatedItem.quantity * updatedItem.stock_price_buy;
    
                    return updatedItem;
                }
                return item;
            });
    
            dispatch(setTableData({ tableName: "order", data: updatedData }));
    
            const total = updatedData.reduce((acc, item) => acc + (item.subtotal || 0), 0);
            dispatch(setTableData({ tableName: "order", data: updatedData }));
        };

    const handleClear = () => {
        dispatch(clearTable({ tableName: "order" }));
        toast.error("Table berhasil dihapus!");
    };

    const handleInputClick = () => {
        const inputData = {
            tanggal: date ? format(date, "yyyy-MM-dd") : null,
            distributor: value || null,
            // tabel: data,
        };
        console.log("Input Data:", inputData);
        toast.success("Produk berhasil diinput!");
        dispatch(clearTable({ tableName: "order" }));
    };


    return (

        <div className="flex flex-col space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="th_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tanggal</FormLabel>
                                            <FormControl>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-[200px] justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? format(new Date(field.value), "d MMMM yyyy", { locale: id })
                                                                : <span>Pilih Tanggal</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date?.toISOString() ?? "")
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                            {/* <FormMessage /> */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="supplier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Supplier</FormLabel>
                                            <FormControl>

                                                <DistributorDD
                                                    value={distributor}
                                                    onChange={(val: number | null) => {
                                                        setDistributor(val)
                                                        field.onChange(val)
                                                    }}
                                                />
                                            </FormControl>
                                            {/* <FormMessage /> */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className='flex items-end gap-2'>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="w-[100vw] max-h-[90vh]">
                                    <TambahProdukModal tableName='order' />
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
                </form>
            </Form >
        </div>

    );
};

export default OrderTransTable;
