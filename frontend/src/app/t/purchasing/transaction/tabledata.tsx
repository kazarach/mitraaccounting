"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { cn, fetcher, fetcherpost } from '@/lib/utils';
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
import DistributorDD from '@/components/dropdown-normal/distributor_dd';
import OperatorDD from '@/components/dropdown-normal/operator_dd';
import DatePick from '@/components/dropdown-normal/datePick_dd';
import { z } from "zod"
import { id } from 'date-fns/locale'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import BayarTPModal from '@/components/modal/tp-bayar-modal';
import useSWRMutation from 'swr/mutation';




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

type PayloadType = {
    th_type: string;
    supplier: number;
    th_ppn:number;
    cashier: number;
    th_disc: number;
    th_date: string;
    th_note: string;
    items: {
        stock: number;
        stock_code: string;
        stock_name: string;
        stock_price_buy: number;
        quantity: number;
        disc: number;
    }[];
};


interface TransactionRow {
    id: number;
    stock_name: string;
    jumlah_pesanan: number;
    quantity: number;
    stock_price_buy: number;
    isi_packing: number;
    satuan: string;
    subtotal: number;
    disc?: number; // Diskon dalam Rp
    disc_percent?: number; // Diskon 1 dalam persen
    disc_percent2?: number; // Diskon 2 dalam persen
}

interface Props {
    tableName: string;
}

const TransactionTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = React.useState<Date>()
    const [value, setValue] = React.useState("")
    const [isPpnIncluded, setIsPpnIncluded] = useState(false);
    const [distributor, setDistributor] = useState<number | null>(null);
    const [submitAction, setSubmitAction] = useState<"simpan" | "bayar" | "harga" | null>(null);


    const data = useSelector((state: RootState) => state.table[tableName] || []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            supplier: undefined,
            th_disc: 0,
        },
    })

    const refs = useRef<Record<number, {
        quantity?: HTMLInputElement | null;
        price?: HTMLInputElement | null;
        disc?: HTMLInputElement | null;
        disc1?: HTMLInputElement | null;
        disc2?: HTMLInputElement | null;
        deleteBtn?: HTMLButtonElement | null;
    }>>({});

    function onSubmit(values: z.infer<typeof formSchema>) {
    if (!data.length) {
        toast.error("Silakan tambahkan produk terlebih dahulu.");
        return;
    }

    const payload: PayloadType = {
        th_type: "PURCHASE",
        th_ppn: isPpnIncluded ? 0 : 11,
        supplier: values.supplier,
        cashier: 3,
        th_disc: values.th_disc,
        th_date: values.th_date,
        th_note: "Test",
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

    console.log("Payload JSON:", JSON.stringify(payload, null, 2));

    if (submitAction === "simpan") {
        console.log("Simpan diklik. Payload:", payload);
        trigger(payload)
            .then((res) => {
                console.log(res)
                toast.success("Transaksi berhasil disimpan!");
            })
            .catch((err) => {
                toast.error(err.message);
            });
    }

    if (submitAction === "bayar") {
        console.log("Bayar diklik. Payload:", payload);
        trigger(payload)
            .then((res) => {
                console.log(res)
                toast.success("Preview bayar siap ditampilkan.");
            })
            .catch((err) => {
                toast.error(err.message);
            });
    }
}


    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const { trigger, data: review, error, isMutating } = useSWRMutation<
        any, // response type
        any, // error type
        string, // URL key
        PayloadType // arg type, ini penting!
    >(
        `${API_URL}/api/transactions/calculate_preview/`,
        fetcherpost
    );
    // console.log(response)


    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "stock_name",
        },
        {
            header: "Pesanan",
            accessorKey: "jumlah_pesanan",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
        },
        {
            header: "Barang",

            cell: ({ row }) => {
                const jumlahBarang = row.original.quantity || 0;

                return (
                    <input
                        ref={(el) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].quantity = el;
                        }}
                        type="number"
                        defaultValue={jumlahBarang}
                        onKeyDown={(e) => {
                            if (e.key === "Tab" && !e.shiftKey) {
                                e.preventDefault(); // Stop default tab behavior
                                setTimeout(() => {
                                    refs.current[row.original.id]?.price?.focus(); // Delay pindah focus
                                }, 0);
                            }
                        }}
                        onBlur={(e) => handleChange(e, row.original.id, 'quantity')}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
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
            header: "Harga Beli",
            cell: ({ row }) => {
                const stock_price_buy = row.original.stock_price_buy || 0;

                return (
                    <input
                        ref={(el: any) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].price = el;
                        }}
                        type="number"
                        defaultValue={stock_price_buy}
                        onKeyDown={(e) => {
                            if (e.key === "Tab" && !e.shiftKey) {
                                e.preventDefault(); // Stop default tab behavior
                                setTimeout(() => {
                                    refs.current[row.original.id]?.disc?.focus(); // Delay pindah focus
                                }, 0);
                            }
                        }}
                        onBlur={(e) => handleChange(e, row.original.id, 'stock_price_buy')}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    />
                );
            },
        },
        {
            header: "Diskon (Rp)",
            cell: ({ row }) => {
                const disc = row.original.disc || 0;

                return (
                    <input
                        ref={(el) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].disc = el;
                        }}
                        type="number"
                        defaultValue={disc}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                                e.preventDefault();
                                refs.current[row.original.id]?.disc1?.focus();
                            }
                        }}
                        onBlur={(e) => handleChange(e, row.original.id, "disc")}
                        className="pl-1 text-left w-20 bg-gray-100 rounded-sm"
                    />
                );
            },
        },
        {
            header: "Diskon (%)",
            cell: ({ row }) => {
                const disc_percent = row.original.disc_percent || 0;

                return (
                    <input
                        ref={(el) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].disc1 = el;
                        }}
                        type="number"
                        defaultValue={disc_percent}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                                e.preventDefault();
                                refs.current[row.original.id]?.disc2?.focus();
                            }
                        }}
                        onBlur={(e) => handleChange(e, row.original.id, "disc_percent")}
                        className="pl-1 text-left w-20 bg-gray-100 rounded-sm"
                    />
                );
            },
        },
        {
            header: "Diskon 2 (%)",
            cell: ({ row }) => {
                const disc_percent2 = row.original.disc_percent2 || 0;

                return (
                    <input
                        ref={(el) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].disc2 = el;
                        }}
                        type="number"
                        defaultValue={disc_percent2}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                                e.preventDefault();
                                refs.current[row.original.id]?.deleteBtn?.focus();
                            }
                        }}
                        onBlur={(e) => handleChange(e, row.original.id, "disc_percent2")}
                        className="pl-1 text-left w-20 bg-gray-100 rounded-sm"
                    />
                );
            },
        },

        {
            header: "Total",
            cell: ({ row }) => {
                const price = row.original.stock_price_buy || 0;
                const qty = row.original.quantity || 0;
                const disc = row.original.disc || 0;
                const disc1 = row.original.disc_percent || 0;
                const disc2 = row.original.disc_percent2 || 0;

                const afterDisc1 = price - disc;
                const afterDisc2 = afterDisc1 - (afterDisc1 * disc1 / 100);
                const afterDisc3 = afterDisc2 - (afterDisc2 * disc2 / 100);
                const subtotal = qty * afterDisc3;

                return (
                    <div className="text-left">
                        Rp{Math.round(subtotal).toLocaleString("id-ID")}
                    </div>
                );
            },
        },

        {
            header: "Inc. PPN",
            cell: ({ row }) => {
                const price = row.original.stock_price_buy || 0;
                const qty = row.original.quantity || 0;
                const disc = row.original.disc || 0;
                const disc1 = row.original.disc_percent || 0;
                const disc2 = row.original.disc_percent2 || 0;

                const afterDisc1 = price - disc;
                const afterDisc2 = afterDisc1 - (afterDisc1 * disc1 / 100);
                const afterDisc3 = afterDisc2 - (afterDisc2 * disc2 / 100);
                const subtotal = qty * afterDisc3;
                const final = isPpnIncluded ? subtotal : subtotal * 1.11;

                return (
                    <div className="text-left">
                        Rp{Math.round(final).toLocaleString("id-ID")}
                    </div>
                );
            },
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-center">
                    <Button
                        ref={(el) => {
                            if (!refs.current[row.original.id]) refs.current[row.original.id] = {};
                            refs.current[row.original.id].deleteBtn = el;
                        }}
                        onClick={() => handleDelete(row.original.id)}
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


    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowId: number, field: string) => {
        const value = parseFloat(e.target.value) || 0;

        const updatedData = data.map((item) => {
            if (item.id === rowId) {
                const updatedItem = { ...item };

                if (field === "quantity") {
                    updatedItem.quantity = value;
                } else if (field === "stock_price_buy") {
                    updatedItem.stock_price_buy = value;
                } else if (field === "disc") {
                    updatedItem.disc = value;
                } else if (field === "disc_percent") {
                    updatedItem.disc_percent = value;
                } else if (field === "disc_percent2") {
                    updatedItem.disc_percent2 = value;
                }
                updatedItem.subtotal = updatedItem.quantity * updatedItem.stock_price_buy
                const af_disc1 = updatedItem.stock_price_buy - (updatedItem.disc || 0)
                const af_disc2 = af_disc1 - (af_disc1 * updatedItem.disc_percent / 100)
                const af_disc3 = af_disc2 - (af_disc2 * updatedItem.disc_percent2 / 100)
                updatedItem.subtotal = updatedItem.quantity * af_disc3

                return updatedItem;
            }
            return item;
        });

        dispatch(setTableData({ tableName: "transaksi", data: updatedData }));
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

        const discNota = form.watch("th_disc") || 0;
        const totalPPN = isPpnIncluded ? 0 : subtotal * 0.11;
        const totalAfterPPN = subtotal + totalPPN;
        const totalFinal = Math.max(totalAfterPPN - discNota, 0);

        return {
            subtotal,
            totalPPN,
            totalAfterPPN,
            totalFinal,
        };
    }, [data, isPpnIncluded, form.watch("th_disc")]);



    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
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
                                                                "w-[150px] h-[30px]  justify-start text-left font-normal",
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
                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="th_disc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Diskon Nota</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className='bg-gray-100 w-[150px] h-[30px]'
                                                    placeholder='0%'
                                                />
                                            </FormControl>
                                            {/* <FormMessage /> */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex  gap-2 items-center pb-2">
                                <Checkbox
                                    id="terms"
                                    checked={isPpnIncluded}
                                    onCheckedChange={handleCheckboxChange}
                                    className="size-5 items-center"
                                />

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
                                <DialogContent className="w-[70vw] max-h-[90vh]">
                                    <TpModal />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="w-[100vw] max-h-[90vh]">
                                    <TambahProdukModal tableName='transaksi' />
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>

                        </div>
                    </div>

                    <div className="rounded-md border overflow-auto overflow-x-hidden">
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
                                    <TableCell colSpan={1} className="text-right font-bold border">
                                        Total Barang:
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">
                                        {data.reduce((acc, item) => acc + (item.jumlah_pesanan || 0), 0)}
                                    </TableCell>

                                    <TableCell className="text-left font-bold border">
                                        {data.reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                    </TableCell>
                                    <TableCell colSpan={6} className="text-right font-bold border">
                                        Total:
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">
                                        <span>Rp{Math.round(totalSummary.subtotal).toLocaleString("id-ID")}</span>
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">
                                        <span>Rp{Math.round(totalSummary.totalAfterPPN).toLocaleString("id-ID")}</span>
                                    </TableCell>
                                    <TableCell className="text-left font-bold border">

                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    <div className='flex justify-end gap-2 mt-4 '>

                        <Dialog>
                            {data.length > 0 ? (
                                <DialogTrigger asChild>
                                    <Button className='font-medium bg-blue-500 hover:bg-blue-600' type='submit'  onClick={() => setSubmitAction("simpan")}>
                                        Simpan
                                    </Button>
                                </DialogTrigger>
                            ) : (
                                <Button
                                    className='font-medium bg-blue-500 hover:bg-blue-600'
                                >
                                    Simpan
                                </Button>
                            )}

                            <DialogContent className="w-[25vw] max-h-[90vh]">
                                <BayarTPModal review={review} />
                            </DialogContent>
                        </Dialog>


                    </div>

                </form>
            </Form >
        </div>
    );
};

export default TransactionTable;
