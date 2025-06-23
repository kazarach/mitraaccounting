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
import { cn, fetcher, fetcherPatch, fetcherPost } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Copy, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format, setDate } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/modal/tp-pesanan-modal';
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
import { useForm, UseFormReturn } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import BayarTPModal from '@/components/modal/tp-bayar-modal';
import useSWRMutation from 'swr/mutation';
import GantiHargaModal from './gantiHargaModal';
import TambahProdukModalTP from './tambahprodukModal';
import PersediaanModal, { Stock } from './persediaanModal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';




const formSchema = z.object({
    th_date: z.string({ required_error: "Pilih Tanggal!" }).datetime({ message: "Pilih Tanggal!" }),
    supplier: z.number({ required_error: "Pilih Supplier!" }),
    th_disc: z.number({ required_error: "Masukkan Diskon Nota" }).optional(),
    th_payment_type: z.string({ required_error: "Pilih Tipe Bayar" }).optional(),
    th_dp: z.number({ required_error: "Masukkan Pembayaran" }).nullable().optional(),
    bank: z.number().optional()
});


type PayloadType = {
    th_type: string;
    supplier: number;
    th_ppn: number;
    cashier: number;
    th_disc: number;
    th_date: string;
    th_note: string;
    th_payment_type: string;
    th_dp: number;
    bank?: number;
    items: {
        stock: number;
        stock_code: string;
        stock_name: string;
        stock_price_buy: number;
        quantity: number;
        disc: number;
    }[];
    _method?: 'POST' | 'PUT';
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
    const [supplier, setSupplier] = useState<number | null>(null);
    const [value, setValue] = React.useState("")
    const [isPpnIncluded, setIsPpnIncluded] = useState(true);
    const [submitAction, setSubmitAction] = useState<"simpan" | "bayar" | "harga" | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [supplier_name, setSupplierName] = useState<string>("");
    const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);
    const [isGantiHargaModalOpen, setIsGantiHargaModalOpen] = useState(false);
    const [isTambahProdukModalOpen, setIsTambahProdukModalOpe] = useState(false);
    const [isPersediaanOpen, setIsPersediaanOpen] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);
    const [pricesData, setPricesData] = useState<any>(null);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

    const openPersediaanModalWithStock = (stock: Stock) => {
        setSelectedStock(stock);
        setIsPersediaanOpen(true);
    };

    const openPersediaanModal = () => {
        setSelectedStock(null);
        setIsPersediaanOpen(true);
    };


    const data = useSelector((state: RootState) => state.table[tableName] || []);

    useEffect(() => {
        if (data.length > 0) {
            const firstRow = data[0];

            if (firstRow.th_date && firstRow.supplier) {
                const parsedDate = new Date(firstRow.th_date);
                if (!isNaN(parsedDate.getTime())) {
                    setDate(parsedDate);
                }

                setSupplier(firstRow.supplier);
            }
        }
    }, [data]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            supplier: undefined,
            th_disc: 0,
            th_dp: null,
            th_payment_type: "CASH",       // nilai awal wajib
            bank: undefined,
        },
    })

    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const { trigger, data: review, error, isMutating } = useSWRMutation<any, any, string, PayloadType>(
        `${API_URL}/api/transactions/calculate_preview/`,
        fetcherPost
    );

    const { trigger: post, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `${API_URL}api/transactions/`,
        fetcherPost
    );

    const { trigger: patch, data: tsc2, error: tscerror2, isMutating: tscmutating2 } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `${API_URL}api/transactions`,
        fetcherPatch
    );

    const { trigger: checkPriceTrigger, data: priceData, error: priceCheckError } = useSWRMutation<any, any, string, any>(
        `${API_URL}api/stock/by_ids/`,
        fetcherPost
    );

    useEffect(() => {
        if (review) {
            const th_dp = data?.[0]?.th_dp || 0;
            const updatedReview = {
                ...review,
                th_dp,
            };
            setReviewData(updatedReview);
        }
    }, [review, data]);

    useEffect(() => {
        if (priceData && data) {
            console.log("Cek priceItem.id vs item.stock:");
            console.log("priceData:", priceData);
            console.log("data:", data);

            const updatedPriceData = priceData.map((priceItem: any) => {
                const matchedItem = data.find(item => item.stock === priceItem.id);
                console.log(matchedItem)
                return {
                    ...priceItem,
                    stock_price_buy: matchedItem ? matchedItem.stock_price_buy : null,
                };
            });
            setPricesData(updatedPriceData);
        }


    }, [priceData, data]);

    const th_disc = form.getValues("th_disc") || 0;

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!data.length) {
            toast.error("Silakan tambahkan produk terlebih dahulu.");
            return;
        }


        if (submitAction === "bayar") {
            const values2 = form.getValues();
            const id = data?.[0]?.transaction_id;
            // console.log(id + " id")
            console.log(values2.th_dp)
            const th_dp = data?.[0]?.th_dp || 0;
            console.log(th_dp)
            const payload2: any = {
                th_type: "PURCHASE",
                th_ppn: isPpnIncluded ? 0 : 11,
                supplier: values.supplier,
                cashier: 3,
                th_disc: values.th_disc,
                th_date: values.th_date,
                th_note: "",
                th_payment_type: values2.th_payment_type || "",
                th_dp: (th_dp + values2.th_dp),
                th_order: false,
                th_order_reference: id || undefined,
                th_status: true,
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
            console.log(payload2.th_dp)

            console.log(JSON.stringify(payload2, null, 1));

            post(payload2)
                .then((res) => {
                    console.log("pembayaran")
                    console.log(res)
                    toast.success("Pembayaran berhasil");
                    // dispatch(clearTable({ tableName }));
                })
                .catch((err) => {
                    toast.error(err.message);
                });


            const payload3: any = {
                item_ids: review.items.map((item: any) => item.stock_id),
            }
            console.log(JSON.stringify(payload3, null, 1));
            checkPriceTrigger(payload3)
                .then((res) => {
                    console.log(res)
                })
                .catch((err) => {
                    toast.error(err.message);
                });

            if (id) {
                const payload: any = {
                    th_order: false,
                    th_status: true,
                };

                // console.log(JSON.stringify(payload2, null, 1));

                patch({ id, data: payload })
                    .then((res) => {
                        console.log("ganti order")
                        console.log(res)

                    })
                    .catch((err) => {
                        toast.error(err.message);
                    });
            }
            setSubmitAction("harga");
        };



        if (submitAction === "simpan") {
            const th_dp = data?.[0]?.th_dp;
            const payload: any = {
                th_type: "PURCHASE",
                th_ppn: isPpnIncluded ? 0 : 11,
                supplier: values.supplier,
                cashier: 3,
                th_disc: values.th_disc,
                th_date: values.th_date,
                th_note: "Test",
                th_payment_type: "BANK",
                th_dp: th_dp || 0,
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
            // console.log(JSON.stringify(payload, null, 1));

            trigger(payload)
                .then((res) => {
                    console.log("calculate")
                    console.log(res)
                })
                .catch((err) => {
                    toast.error(err.message);
                });
            setSubmitAction("bayar");

        }
    }



    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "stock_name",
            size: 240,
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
        {
            header: "Pesanan",
            accessorKey: "jumlah_pesanan",
            cell: (info) => <div className="text-left">{info.getValue<number>()}</div>,
            size: 80
        },
        {
            header: "Barang",

            cell: ({ row }) => {
                const jumlahBarang = row.original.quantity || 0;

                return (
                    <input
                        type="number"
                        defaultValue={jumlahBarang}

                        onChange={(e) => handleChange(e, row.original.id, 'quantity')}
                        className="pl-1 text-left bg-gray-100 rounded-sm w-full"
                    />
                );
            },
            size: 80
        },

        {
            header: "Harga Beli",
            cell: ({ row }) => {
                const stock_price_buy = row.original.stock_price_buy || 0;

                return (
                    <input

                        type="number"
                        defaultValue={stock_price_buy}

                        onChange={(e) => handleChange(e, row.original.id, 'stock_price_buy')}
                        className="pl-1 text-left w-full bg-gray-100 rounded-sm"
                    />
                );
            },
            size: 80
        },
        {
            header: "Diskon (Rp)",
            cell: ({ row }) => {
                const disc = row.original.disc || 0;

                return (
                    <input

                        type="number"
                        defaultValue={disc}

                        onChange={(e) => handleChange(e, row.original.id, "disc")}
                        className="pl-1 text-left w-full bg-gray-100 rounded-sm"
                    />
                );
            },
            size: 90
        },
        {
            header: "Diskon (%)",
            cell: ({ row }) => {
                const disc_percent = row.original.disc_percent || 0;

                return (
                    <input

                        type="number"
                        defaultValue={disc_percent}

                        onChange={(e) => handleChange(e, row.original.id, "disc_percent")}
                        className="pl-1 text-left w-full bg-gray-100 rounded-sm"
                    />
                );
            },
            size: 90
        },
        {
            header: "Diskon 2 (%)",
            cell: ({ row }) => {
                const disc_percent2 = row.original.disc_percent2 || 0;

                return (
                    <input

                        type="number"
                        defaultValue={disc_percent2}

                        onChange={(e) => handleChange(e, row.original.id, "disc_percent2")}
                        className="pl-1 text-left w-full bg-gray-100 rounded-sm"
                    />
                );
            },
            size: 90
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
                        {subtotal.toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                        })}
                    </div>
                );
            },
            size: 100
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
                        {final.toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                        })}
                    </div>
                );
            },
            size: 100
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-center">
                    <Button

                        onClick={() => handleDelete(row.original.id)}
                        className="bg-red-500 hover:bg-red-600 size-7"
                    >
                        <Trash />
                    </Button>
                </div>
            ),
            size: 50,
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

        // Clear the previous timeout
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        // Set a new timeout to call handleChange after 500ms delay
        debounceTimeout.current = setTimeout(() => {
            const updatedData = data.map((item) => {
                if (item.id === rowId) {
                    const updatedItem = { ...item };
                    if (field === 'quantity') {
                        updatedItem.quantity = value;
                    } else if (field === 'stock_price_buy') {
                        updatedItem.stock_price_buy = value;
                    } else if (field === 'disc') {
                        updatedItem.disc = value;
                    } else if (field === 'disc_percent') {
                        updatedItem.disc_percent = value;
                    } else if (field === 'disc_percent2') {
                        updatedItem.disc_percent2 = value;
                    }
                    // Recalculate the subtotal after updating the field
                    updatedItem.subtotal = updatedItem.quantity * updatedItem.stock_price_buy;
                    const af_disc1 = updatedItem.stock_price_buy - (updatedItem.disc || 0);
                    const af_disc2 = af_disc1 - (af_disc1 * updatedItem.disc_percent / 100);
                    const af_disc3 = af_disc2 - (af_disc2 * updatedItem.disc_percent2 / 100);
                    updatedItem.subtotal = updatedItem.quantity * af_disc3;

                    return updatedItem;
                }
                return item;
            });

            dispatch(setTableData({ tableName: "transaksi", data: updatedData }));
        }, 200);
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
                                                    value={supplier}
                                                    onChange={(val: number | null, label: string | null) => {
                                                        setSupplier(val)
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
                                <DialogContent className="w-full max-h-[90vh]">
                                    <TpModal />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="w-12/12 max-h-[90vh]">
                                    <TambahProdukModalTP
                                        tableName="transaksi"
                                        onClose={() => setIsTambahProdukModalOpe(false)}
                                        onOpenNext={() => setIsPersediaanOpen(true)}
                                        openPersediaanModalWithStock={openPersediaanModalWithStock}
                                        openPersediaanModal={openPersediaanModal}
                                    />

                                </DialogContent>
                            </Dialog>

                            <Dialog open={isPersediaanOpen} onOpenChange={setIsPersediaanOpen}>
                                <DialogContent className="w-2/3 h-auto max-h-[90vh]">
                                    <PersediaanModal
                                        stockData={pricesData}
                                        selectedStock={selectedStock}
                                        setSelectedStock={setSelectedStock}
                                        onClose={() => setIsPersediaanOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>

                        </div>
                    </div>

                    <ScrollArea className="relative z-0 h-[calc(100vh-300px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
                        <div className="w-max text-sm border-separate border-spacing-0 min-w-full">
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
                                {/* <TableFooter>
                                    <TableRow className="bg-white">
                                        <TableCell colSpan={3} className="text-right font-bold border">
                                            Total Barang:
                                        </TableCell>
                                        <TableCell className="text-left font-bold border">
                                            {data.reduce((acc, item) => acc + (item.jumlah_pesanan || 0), 0)}
                                        </TableCell>

                                        <TableCell className="text-left font-bold border">
                                            {data.reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                        </TableCell>
                                        <TableCell colSpan={4} className="text-right font-bold border">
                                            Total:
                                        </TableCell>
                                        <TableCell className="text-left font-bold border">
                                            <span>{totalSummary.subtotal.toLocaleString("id-ID", {
                                                maximumFractionDigits: 2,
                                            })}</span>
                                        </TableCell>
                                        <TableCell className="text-left font-bold border">
                                            <span>{totalSummary.totalAfterPPN.toLocaleString("id-ID", {
                                                maximumFractionDigits: 2,
                                            })}</span>
                                        </TableCell>
                                        <TableCell className="text-left font-bold border">

                                        </TableCell>
                                    </TableRow>
                                </TableFooter> */}
                                <TableFooter className="sticky bg-gray-100 bottom-0 z-10 border-2">
                                    <TableRow className="relative h-[40px]">
                                        {table.getHeaderGroups()[0].headers.map((header, index) => {
                                            const column = header.column;
                                            let content: React.ReactNode = "";
                                            switch (index) {
                                                case 2:
                                                    content = "Total Barang:";
                                                    break;
                                                case 3:
                                                    content = data.reduce((acc, item) => acc + (item.jumlah_pesanan || 0), 0);
                                                    break;
                                                case 4:
                                                    content = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
                                                    break;
                                                case 7:
                                                    content = "Total:";
                                                    break;
                                                case 8:
                                                    content =
                                                        totalSummary && totalSummary.subtotal != null
                                                            ? totalSummary.subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })
                                                            : "-";
                                                    break;
                                                case 9:
                                                    content =
                                                        totalSummary && totalSummary.totalAfterPPN != null
                                                            ? totalSummary.totalAfterPPN.toLocaleString("id-ID", { maximumFractionDigits: 2 })
                                                            : "-";
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
                        <ScrollBar orientation="horizontal" />
                        <ScrollBar orientation="vertical" className='z-40' />
                    </ScrollArea>
                    <div className='flex justify-end gap-2 mt-4 '>

                        <Dialog open={isBayarModalOpen} onOpenChange={setIsBayarModalOpen}>
                            {data.length > 0 ? (
                                <DialogTrigger asChild>
                                    <Button
                                        className="font-medium bg-blue-500 hover:bg-blue-600"
                                        type="submit"
                                        onClick={() => {
                                            setSubmitAction("simpan");
                                            setIsBayarModalOpen(true);
                                        }}
                                    >
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

                            <DialogContent className="w-1/4 max-h-11/12" onInteractOutside={e => e.preventDefault()}>
                                <BayarTPModal
                                    review={reviewData}
                                    form={form}
                                    date={date}
                                    setDate={setDate}
                                    supplier_name={supplier_name}
                                    onClose={() => setIsBayarModalOpen(false)}
                                    onOpenNext={() => setIsGantiHargaModalOpen(true)}
                                    onSubmit={form.handleSubmit(onSubmit)}
                                />
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isGantiHargaModalOpen} onOpenChange={setIsGantiHargaModalOpen}>
                            <DialogContent className="w-12/12 h-11/12 max-h-[90vh]" onInteractOutside={e => e.preventDefault()}>
                                <GantiHargaModal priceData={pricesData} onClose={() => setIsGantiHargaModalOpen(false)} />
                            </DialogContent>
                        </Dialog>


                    </div>

                </form>
            </Form >
        </div>
    );
};

export default TransactionTable;
