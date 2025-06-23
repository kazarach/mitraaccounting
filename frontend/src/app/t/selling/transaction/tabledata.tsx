"use client";
import React, { useState } from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from "zod"
import { id } from 'date-fns/locale'
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import BayarTPModal from '@/components/modal/tp-bayar-modal';
import CustomerDDTS from './customer-dd';
import TambahProdukModalSelling from './tambahprodukmodalselling';
import TpModalSelling from './modalpesanan';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import BayarTPModalJual from './previewmodal';
import useSWR from 'swr';

type Customer = {
    id: number;
    name: string;
    price_category?: {
        id: number;
        name: string;
    };
};

const formSchema = z.object({
    th_date: z.string({
        required_error: "Pilih Tanggal!"
    }).datetime({ message: "Pilih Tanggal!" }),
    customer: z.number({
        required_error: "Pilih Customer!"
    }).nullable(),
    th_disc: z.number({
        required_error: "Masukkan Diskon Nota"
    }),
})

interface TransactionRow {
    id: number;
    stock: number;
    barcode: string;
    stock_code: string;
    stock_name: string;
    unit: string;
    jumlah_pesanan: number;
    quantity: number;
    stock_price_buy: number;
    stock_price_sell: number;
    discount: number;
    netto: number;
    total: number;
    satuan: string;
    isi_packing: number;
    subtotal: number;

    prices?: {
        price_category: number;
        price_sell: string;
    }[]; // ⬅️ TAMBAHKAN INI
}


interface Props {
    tableName: string;
}

const TransactionSellingTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = React.useState<Date>()
    const [value, setValue] = React.useState("")
    const [isPpnIncluded, setIsPpnIncluded] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [previewData, setPreviewData] = useState<any>(null); // untuk menyimpan response dari API
    const [thDisc, setThDisc] = useState(0);
    const [thDp, setThDp] = useState(0); // Tambahkan ini
    const [cashierId, setCashierId] = useState<number | null>(null);

    const data = useSelector((state: RootState) => state.table[tableName] || []);
    // console.log("🟡 data dari Redux:", data);

    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            th_date: new Date().toISOString(),
            customer: undefined,
            th_disc: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        toast.success("Form berhasil dihapus!")
        console.log(values)
        dispatch(clearTable({ tableName }));
    }

    const updateHargaJualByCustomer = (priceCategoryId: number) => {
        const updated = data.map((item) => {
            const selectedPrice = item.prices?.find((p: any) => p.price_category === priceCategoryId);
            return {
                ...item,
                stock_price_sell: selectedPrice ? parseFloat(selectedPrice.price_sell) : item.stock_price_sell,
            };
        });

        dispatch(setTableData({ tableName, data: updated }));
    };

    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "stock_name",
        },
        {
            header: "Jumlah Barang",
            cell: ({ row }) => {
                const initialQty = row.original.quantity ?? 0;
                const [localQty, setLocalQty] = useState(initialQty);

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    const parsed = parseFloat(value);
                    setLocalQty(value === "" ? 0 : isNaN(parsed) ? 0 : parsed); // izinkan kosong saat mengetik
                };

                const handleBlur = () => {
                    handleChange(
                        { target: { value: localQty.toString() } } as React.ChangeEvent<HTMLInputElement>,
                        row.original.id,
                        "quantity"
                    );
                };

                return (
                    <input
                        type="number"
                        value={localQty}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
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
            header: "Harga Jual",
            cell: ({ row }) => {
                const stock_price_sell = row.original.stock_price_sell || 0;

                return (
                    <div className="text-left pl-1">
                        {Number(stock_price_sell).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                );
            },
        },
        {
            header: "Diskon (Rp)",
            cell: ({ row }) => {
                const initialDisc = row.original.discount ?? 0;
                const [localDisc, setLocalDisc] = useState(initialDisc);

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    const parsed = parseFloat(value);
                    setLocalDisc(value === "" ? 0 : isNaN(parsed) ? 0 : parsed);
                };

                const handleBlur = () => {
                    handleChange(
                        { target: { value: localDisc.toString() } } as React.ChangeEvent<HTMLInputElement>,
                        row.original.id,
                        "discount"
                    );
                };

                return (
                    <input
                        type="number"
                        value={localDisc}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="pl-1 text-left w-20 bg-gray-100 rounded-sm"
                        placeholder="Rp0"
                    />
                );
            },
        },
        {
            header: "Total",
            cell: ({ row }) => {
                const harga = row.original.stock_price_sell || 0;
                const quantity = row.original.quantity || 0;
                const disc = row.original.discount || 0;
                const subtotal = (harga - disc) * quantity;
                return (
                    <div className="">{subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
                );
            },
        },
        {
            header: "Inc. PPN",
            cell: ({ row }) => {
                const harga = row.original.stock_price_sell || 0;
                const quantity = row.original.quantity || 0;
                const disc = row.original.discount || 0;
                const subtotal = (harga - disc) * quantity;
                const finalTotal = isPpnIncluded ? subtotal : subtotal * 1.11;
                return (
                    <div className="text-left">{finalTotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
                );
            },
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-left">
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
        columnResizeMode: "onChange",
        columnResizeDirection: "ltr",
        defaultColumn: {
            size: 150,
            minSize: 50,
            maxSize: 600,
            enableResizing: true,
        },
    });


    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        rowId: number,
        field: 'quantity' | 'stock_price_sell' | 'discount'
    ) => {
        const value = parseFloat(e.target.value) || 0;

        const updatedData = data.map((item) => {
            if (item.id !== rowId) return item;

            const updatedItem = { ...item };

            if (field === 'quantity') {
                updatedItem.quantity = value;
            } else if (field === 'stock_price_sell') {
                updatedItem.stock_price_sell = value;
            } else if (field === 'discount') {
                updatedItem.discount = value;
            }

            const totalHarga = (updatedItem.stock_price_sell ?? 0) - (updatedItem.discount ?? 0);
            updatedItem.subtotal = (updatedItem.quantity ?? 0) * totalHarga;

            return updatedItem;
        });

        dispatch(setTableData({ tableName, data: updatedData }));
    };


    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Tabel berhasil dihapus!");

        form.reset({
            th_date: new Date().toISOString(), // ← reset ke hari ini atau kosongkan
            customer: null,
            th_disc: 0,
        });

        setCustomer(null);
    };

    const getTotalWithPPN = () => {
        const total = data.reduce((acc, item) => {
            const harga = Number(item.stock_price_sell) || 0;
            const quantity = Number(item.quantity) || 0;
            return acc + (harga * quantity);
        }, 0);

        const th_disc = form.getValues("th_disc") || 0;
        const totalSetelahDiskon = total * (1 - th_disc / 100);

        return isPpnIncluded ? totalSetelahDiskon * 1.11 : totalSetelahDiskon;
    };

    const th_disc = form.watch("th_disc") || 0;
    const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);

    const postOnlyTableItems = async () => {
        const customer_id = form.getValues("customer");
        const th_disc = form.getValues("th_disc");
        const th_ppn = isPpnIncluded ? 0 : 11;
        const th_payment_type = 'BANK';
        const transactionId = previewData?.transactionId;

        if (!customer_id) {
            toast.error("Pilih customer terlebih dahulu!");
            return;
        }
        if (!data.length) {
            toast.error("Silakan tambahkan produk terlebih dahulu.");
            return;
        }
        try {
            const items = data
                .filter(item => typeof item.id === "number")
                .map(item => ({
                    stock: item.stock,
                    stock_code: item.stock_code,
                    stock_name: item.stock_name,
                    quantity: Number(item.quantity || 0),
                    satuan: item.unit || "",
                    stock_price_buy: Number(item.stock_price_buy || 0),
                    sell_price: Number(item.stock_price_sell || 0),
                    disc: Number(item.discount || 0),
                }));
            console.log("✅ items yang akan dikirim:");
            console.table(items);
            
            const API_URL = process.env.NEXT_PUBLIC_API_URL!;
            const endpoint = `${API_URL}api/transactions/calculate_preview/`;
            const { data: me, error, isLoading, mutate } = useSWR(`${API_URL}api/users/me/`, fetcher);
            const customer_id = form.getValues("customer"); // sudah ID, bukan name

            const payload = {
                th_type: "SALE", // ← masih wajib karena backend minta
                customer: customer_id,
                th_disc: th_disc,
                th_ppn: th_ppn,
                th_payment_type: th_payment_type,
                th_dp: thDp,
                cashier: me.id,
                ...(transactionId && { id: transactionId }),
                items,
            };


            console.log("Payload:", JSON.stringify(payload, null, 2));
            const accessToken = localStorage.getItem("access") ?? "";
            const refreshToken = localStorage.getItem("refresh") ?? "";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "x-refresh-token": refreshToken
                },
                body: JSON.stringify(payload),
            });


            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const result = await response.json();
            console.log("Response dari server:", result);
            toast.success("Data dari table berhasil dikirim ke server modal!");

            // Simpan hasil ke state
            setPreviewData({
                ...result,
                customer_name: customer?.name ?? "",
                th_dp: thDp,
                fromOrderModal: true,
                transactionId: result?.id ?? payload.id,
                _rawPayload: {
                    th_type: "SALE",
                    customer: customer_id,
                    th_disc: th_disc,
                    th_ppn: th_ppn,
                    th_payment_type: th_payment_type,
                    id: result?.id ?? payload.id,
                    cashier: me.id,
                    items
                }
            });
            setIsBayarModalOpen(true);
        } catch (error) {
            console.error("Gagal kirim data:", error);
            toast.error("Gagal mengirim data.");
        }
        setIsBayarModalOpen(true);
    };

    return (
        <div className="flex flex-col space-y-4 ">
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
                                                                "w-[150px] h-[30px] justify-start text-left font-normal cursor-pointer",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? format(new Date(field.value), "d/MM/yyyy", { locale: id })
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
                                    name="customer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <FormControl>
                                                <CustomerDDTS
                                                    value={customer?.id ?? null}
                                                    onChange={(selectedCustomer) => {
                                                        setCustomer(selectedCustomer);
                                                        form.setValue("customer", selectedCustomer?.id ?? null);

                                                        const priceCategoryId = selectedCustomer?.price_category?.id ?? 1;
                                                        updateHargaJualByCustomer(priceCategoryId); // ⬅️ update harga jual
                                                    }}
                                                />
                                            </FormControl>
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
                                            <FormLabel>Diskon Nota (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value === 0 ? "" : field.value}
                                                    onChange={(e) => {
                                                        const input = e.target.value.replace(/^0+(?!$)/, ""); // hilangkan leading zero
                                                        const parsed = parseFloat(input) || 0;
                                                        field.onChange(parsed);
                                                        setThDisc(parsed); // ← update state diskon
                                                    }}
                                                    className='bg-gray-100 w-[150px] h-[30px]'
                                                    placeholder='0%'
                                                />
                                            </FormControl>
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
                                    <Button className='font-medium bg-blue-500 hover:bg-blue-600 cursor-pointer'>Pesanan</Button>
                                </DialogTrigger>
                                <DialogContent className="min-w-[30vw] max-h-[90vh]" >
                                    <TpModalSelling
                                        onCustomerSelect={(id, name, priceCategoryId, thDate, thDisc, thPpn, thDp, transactionId, cashierId) => {
                                            const customerData = {
                                                id,
                                                name,
                                                price_category: { id: priceCategoryId, name: "" }
                                            };
                                            setCustomer(customerData);
                                            form.setValue("customer", id);
                                            if (thDate) form.setValue("th_date", new Date(thDate).toISOString());
                                            form.setValue("th_disc", 0); // kosongkan input, tidak menarik nilai
                                            setThDisc(0); // tetap 0 untuk perhitungan
                                            setIsPpnIncluded(thPpn === 0);
                                            setThDp(thDp ?? 0);
                                            setCashierId(cashierId ?? null);

                                            // ⬇️ TAMBAHKAN INI agar transactionId tidak hilang
                                            setPreviewData((prev: typeof previewData) => ({
                                                ...prev,
                                                fromOrderModal: true,
                                                transactionId: transactionId ?? null,
                                                _rawPayload: {
                                                    th_type: "SALE",
                                                    customer: id,
                                                    th_disc: Number(thDisc),
                                                    th_ppn: thPpn,
                                                    th_dp: thDp,
                                                    items: data, // ← kalau belum ada data dari invoice, bisa kosong
                                                }
                                            }));
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600 cursor-pointer">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh]">
                                    <TambahProdukModalSelling
                                        tableName="s_transaksi"
                                        priceCategoryId={customer?.price_category?.id ?? 1}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer'>Batal</Button>

                        </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-300px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
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

                                <TableFooter className="sticky bg-gray-100 bottom-0 z-10 border-2">
                                    <TableRow className="relative h-[40px]">
                                        {table.getHeaderGroups()[0].headers.map((header, index) => {
                                            const column = header.column;
                                            let content: React.ReactNode = "";

                                            // Tetapkan isi berdasarkan index kolom
                                            switch (index) {
                                                case 0:
                                                    content = "Total Barang:";
                                                    break;
                                                case 1:
                                                    content = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
                                                    break;
                                                case 4:
                                                    content = "Total:";
                                                    break;
                                                case 5:
                                                    content = data.reduce((acc, item) => {
                                                        const harga = item.stock_price_sell || 0;
                                                        const disc = item.discount || 0;
                                                        const quantity = item.quantity || 0;
                                                        const subtotal = (harga - disc) * quantity;
                                                        const setelahDiskonNota = subtotal * (1 - th_disc / 100);
                                                        return acc + setelahDiskonNota;
                                                    }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                                    break;
                                                case 6:
                                                    content = data.reduce((acc, item) => {
                                                        const harga = item.stock_price_sell || 0;
                                                        const disc = item.discount || 0;
                                                        const quantity = item.quantity || 0;
                                                        const subtotal = (harga - disc) * quantity;
                                                        const setelahDiskonNota = subtotal * (1 - th_disc / 100);
                                                        const finalTotal = isPpnIncluded ? setelahDiskonNota : setelahDiskonNota * 1.11;
                                                        return acc + finalTotal;
                                                    }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                                    break;
                                                default:
                                                    content = "";
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
                            <Button
                                type="button"
                                onClick={postOnlyTableItems}
                                className='font-medium bg-blue-500 hover:bg-blue-600 cursor-pointer'
                            >
                                Simpan
                            </Button>
                            <DialogContent className="min-w-[30vw] max-h-[90vh]">
                                <BayarTPModalJual
                                    data={{ ...previewData, transactionId: previewData?.transactionId, fromOrderModal: previewData?.fromOrderModal }}
                                    onSuccess={() => {
                                        dispatch(clearTable({ tableName }));
                                        setIsBayarModalOpen(false);
                                        form.reset({
                                            th_date: new Date().toISOString(),
                                            customer: null,
                                            th_disc: 0,
                                        });
                                        setCustomer(null);
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </form>
            </Form >
        </div>
    );
};

export default TransactionSellingTable;
