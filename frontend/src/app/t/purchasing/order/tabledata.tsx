"use client";
import React, { useEffect, useMemo, useState } from 'react';

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
import BayarTPModal from '@/components/modal/tp-bayar-modal';
import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';


const formSchema = z.object({
    th_date: z.string({ required_error: "Pilih Tanggal!" }).datetime({ message: "Pilih Tanggal!" }),
    supplier: z.number({ required_error: "Pilih Supplier!" }),
    th_payment_type: z.string({ required_error: "Pilih Tipe Bayar" }).optional(),
    th_dp: z.number({ required_error: "Masukkan Pembayaran" }).optional(),
    bank: z.number().optional()
});


type PayloadType = {
    th_type: string;
    supplier: number;
    // th_ppn: number;
    cashier: number;
    // th_disc: number;
    th_date: string;
    th_note: string;
    th_payment_type: string;
    items: {
        stock: number;
        stock_code: string;
        stock_name: string;
        stock_price_buy: number;
        quantity: number;
        // disc: number;
    }[];
};

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
    const data = useSelector((state: RootState) => state.table[tableName] || []);
    const [submitAction, setSubmitAction] = useState<"simpan" | "bayar" | null>(null);
    const [supplier_name, setSupplierName] = useState<string>("");
    const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);
    const [isGantiHargaModalOpen, setIsGantiHargaModalOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            supplier: undefined,
            th_dp: undefined,
            th_payment_type: "CASH",
            bank: undefined,

        },
    })

    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const { trigger, data: review, error, isMutating } = useSWRMutation<any, any, string, PayloadType>(
        `/api/proxy/api/transactions/calculate_preview/`,
        fetcherPost
    );
    const { trigger: post, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `/api/proxy/api/transactions/`,
        fetcherPost
    );

    const { data : me, error:errorme, isLoading, mutate } = useSWR(`/api/proxy/api/users/me/`, fetcher);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!data.length) {
            toast.error("Silakan tambahkan produk terlebih dahulu.");
            return;
        }
        if (submitAction === "simpan") {
            const payload: any = {
                th_type: "PURCHASE",
                supplier: values.supplier,
                cashier: me.id,
                th_date: values.th_date,
                th_note: "Test",
                th_payment_type: "BANK",
                th_dp: values.th_dp || 0,
                bank: undefined,
                items: data.map((item) => ({
                    stock: item.stock,
                    stock_code: item.stock_code || "",
                    stock_name: item.stock_name,
                    stock_price_buy: item.stock_price_buy,
                    quantity: item.quantity,
                    disc: item.disc || 0,
                    disc_percent: item.disc_percent || 0,
                    disc_percent2: item.disc_percent2 || 0,
                })),
            };
            trigger(payload)
                .then((res) => {
                    console.log(res)
                })
                .catch((err) => {
                    toast.error(err.message);
                });
            setSubmitAction("bayar");

        }

        if (submitAction === "bayar") {
            const values2 = form.getValues();
            const payload2: any = {
                th_type: "ORDEROUT",
                supplier: values.supplier,
                cashier: 3,
                th_date: values.th_date,
                th_order: true,
                th_status: true,
                th_payment_type: values2.th_payment_type || "",
                th_dp: values2.th_dp || 0,
                bank: values2.bank,
                items: data.map((item) => ({
                    stock: item.stock,
                    stock_code: item.stock_code || "",
                    stock_name: item.stock_name,
                    stock_price_buy: item.stock_price_buy,
                    quantity: item.quantity,
                    disc: item.disc || 0,
                    disc_percent: item.disc_percent || 0,
                    disc_percent2: item.disc_percent2 || 0,
                })),

            }


            console.log(JSON.stringify(payload2, null, 1));

            post(payload2)
                .then((res) => {
                    console.log(res)
                    dispatch(clearTable({ tableName }));
                    toast.success("Pembayaran berhasil");
                })
                .catch((err) => {
                    toast.error(err.message);
                });


        };
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
                    tableName: tableName,
                    data: [],
                })
            );
        }
    }, [dispatch]);

    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName: tableName, id }));
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

        dispatch(setTableData({ tableName: tableName, data: updatedData }));

        const total = updatedData.reduce((acc, item) => acc + (item.subtotal || 0), 0);
        dispatch(setTableData({ tableName: tableName, data: updatedData }));
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName: tableName }));
        toast.error("Table berhasil dihapus!");
    };


    const totalSummary = useMemo(() => {
        const subtotal = data.reduce((acc, item) => {
            const price = item.stock_price_buy || 0;
            const qty = item.quantity || 0;
            const disc = item.disc || 0;
            const disc1 = item.disc_percent || 0;
            const disc2 = item.disc_percent2 || 0;

            const afterDisc1 = price - disc;
            const afterDisc2 = afterDisc1 - (afterDisc1 * disc1 / 100);
            const afterDisc3 = afterDisc2 - (afterDisc2 * disc2 / 100);
            const subtotalItem = qty * afterDisc3;

            return acc + subtotalItem;
        }, 0);



        return {
            subtotal
        };
    }, [data]);


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
                                                                "w-[150px] h-[30px] justify-start text-left font-normal",
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
                                                    onChange={(val: number | null, label: string | null) => {
                                                        setDistributor(val)
                                                        field.onChange(val)
                                                        setSupplierName(label || "");
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
                                                <TableCell key={cell.id} className="text-left p-2 border-b border-r last:border-r-0">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center text-gray-400 bg-gray-200 ">
                                            Belum menambahkan produk
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-white">
                                    <TableCell colSpan={1} className="text-right font-bold border">
                                        Total Barang:
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">
                                        {data.reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                    </TableCell>
                                    <TableCell colSpan={3} className="text-right font-bold border">
                                        Total:
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">
                                        <span>{totalSummary.subtotal.toLocaleString("id-ID", {
                                            maximumFractionDigits: 2,
                                        })}</span>
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">

                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    <div className='flex justify-end gap-2 mt-4 '>
                        <Dialog open={open} onOpenChange={setOpen}>
                            {data.length > 0 ? (
                                <DialogTrigger asChild>
                                    <Button className='font-medium bg-blue-500 hover:bg-blue-600' type='submit' onClick={() => setSubmitAction("simpan")}>
                                        Simpan
                                    </Button>
                                </DialogTrigger>
                            ) : (
                                <Button
                                    className='font-medium bg-blue-500 hover:bg-blue-600'
                                    onClick={() => toast.success("mantap")}
                                >
                                    Simpan
                                </Button>
                            )}
                            <DialogContent className="w-1/4 max-h-11/12">
                                <BayarTPModal
                                    review={review}                             
                                    supplier_name={supplier_name}
                                    onClose={() => setOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>

                    </div>
                </form>
            </Form >
        </div>

    );
};

export default OrderTransTable;
