"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, fetcher, fetcherPatch, fetcherPost } from "@/lib/utils";
import { CalendarIcon, Search, Trash } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TpModal from "@/components/modal/tp-pesanan-modal";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { addRow, deleteRow, setTableData, clearTable } from "@/store/features/tableSlicer";
import { ColumnDef, flexRender, getCoreRowModel, RowData, useReactTable } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { id as localeId } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import BayarTPModal from "@/components/modal/tp-bayar-modal";
import useSWRMutation from "swr/mutation";
import GantiHargaModal from "./gantiHargaModal";
import TambahProdukModalTP from "./tambahprodukModal";
import PersediaanModal, { Stock } from "./persediaanModal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import DistributorDD from "@/components/dropdown-normal/distributor_dd";

// -------------------- Utils --------------------
const toNum = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    }
}

// -------------------- Schema --------------------
const formSchema = z.object({
    th_date: z.string({ required_error: "Pilih Tanggal!" }).datetime({ message: "Pilih Tanggal!" }),
    supplier: z.number({ required_error: "Pilih Supplier!" }),
    th_disc: z.number().default(0).optional(),
    th_payment_type: z.string().optional(),
    th_dp: z.number().nullable().optional(),
    bank: z.number().optional(),
});

type PayloadType = {
    th_type: number;
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
        disc_percent?: number;
        disc_percent2?: number;
    }[];
    _method?: "POST" | "PUT";
};

interface TransactionRow {
    id: number;
    stock: number;
    stock_code?: string;
    stock_name: string;
    jumlah_pesanan: number;
    quantity: number;
    stock_price_buy: number;
    unit?: string;
    conversion_unit?: string;
    subtotal: number;
    disc?: number; // Rp
    disc_percent?: number; // %
    disc_percent2?: number; // %
    th_date?: string;
    supplier?: number;
    th_dp?: number;
    th_total?: number;
    transaction_id?: number;
}

// -------------------- Component --------------------
interface Props {
    tableName: string;
}

const TransactionTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = useState<Date>();
    const [supplier, setSupplier] = useState<number | null>(null);
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
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);

    const data: TransactionRow[] = useSelector((state: RootState) => state.table[tableName] || []);

    // ---------- Column sizing state (TanStack v8) ----------
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
    const [columnSizingInfo, setColumnSizingInfo] = useState<any>({});

    const openPersediaanModalWithStock = (stock: Stock) => {
        setSelectedStock(stock);
        setIsPersediaanOpen(true);
    };
    const openPersediaanModal = () => {
        setSelectedStock(null);
        setIsPersediaanOpen(true);
    };

    // ---------- Form ----------
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            supplier: undefined,
            th_disc: 0,
            th_dp: 0,
            th_payment_type: "CASH",
            bank: 1,
        },
    });

    // ---------- SWR ----------
    const { trigger, data: review } = useSWRMutation<any, any, string, PayloadType>(
        "/api/proxy/api/transactions/calculate_preview/",
        fetcherPost
    );
    const { trigger: post } = useSWRMutation<any, any, string, any>("/api/proxy/api/transactions/", fetcherPost);
    const { trigger: patch } = useSWRMutation<any, any, string, any>("/api/proxy/api/transactions", fetcherPatch);
    const { trigger: checkPriceTrigger, data: priceData } = useSWRMutation<any, any, string, any>(
        "/api/proxy/api/stock/by_ids/",
        fetcherPost
    );

    useEffect(() => {
        if (review) {
            const th_dp = toNum(data?.[0]?.th_dp);
            setReviewData({ ...review, th_dp });
        }
    }, [review, data]);

    useEffect(() => {
        if (priceData && data) {
            const updatedPriceData = priceData.map((priceItem: any) => {
                const matchedItem = data.find((item) => item.stock === priceItem.id);
                return {
                    ...priceItem,
                    stock_price_buy: matchedItem ? toNum(matchedItem.stock_price_buy) : 0,
                };
            });
            setPricesData(updatedPriceData);
        }
    }, [priceData, data]);

    useEffect(() => {
        if (data.length > 0) {
            const firstRow = data[0];
            if (firstRow.th_date && firstRow.supplier) {
                const parsedDate = new Date(firstRow.th_date);
                if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
                setSupplier(firstRow.supplier ?? null);
            }
        }
    }, [data]);

    // ---------- Submit ----------
    const th_disc = toNum(form.getValues("th_disc"));

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!data.length) {
            toast.error("Silakan tambahkan produk terlebih dahulu.");
            return;
        }

        if (submitAction === "bayar") {
            const values2 = form.getValues();
            const id = data?.[0]?.transaction_id;
            const th_dp = toNum(data?.[0]?.th_dp);
            const th_total = toNum(data?.[0]?.th_total);
            const addDp = toNum(values2.th_dp);
            const totalDp = th_dp + addDp;
            const paymentType = totalDp < th_total ? "CREDIT" : (values2.th_payment_type || "CASH");

            const payload2: any = {
                th_type: 2,
                th_ppn: isPpnIncluded ? 0 : 11,
                supplier: values.supplier,
                cashier: 3,
                th_disc: toNum(values.th_disc),
                th_date: values.th_date,
                th_note: "",
                th_payment_type: paymentType,
                th_dp: totalDp,
                th_order: false,
                th_order_reference: id || undefined,
                th_status: true,
                bank: values2.bank,
                items: data.map((item) => ({
                    stock: item.stock,
                    stock_code: item.stock_code || "",
                    stock_name: item.stock_name,
                    stock_price_buy: toNum(item.stock_price_buy),
                    quantity: toNum(item.quantity),
                    disc: toNum(item.disc),
                    disc_percent: toNum(item.disc_percent),
                    disc_percent2: toNum(item.disc_percent2),
                })),
            };

            post(payload2)
                .then(() => toast.success("Pembayaran berhasil"))
                .catch((err) => toast.error(err.message));

            const payload3: any = {
                item_ids: (reviewData?.items || review?.items || []).map((item: any) => item.stock_id),
            };
            checkPriceTrigger(payload3).catch((err) => toast.error(err.message));

            if (id) {
                patch({ id, data: { th_order: false, th_status: true } }).catch((err) => toast.error(err.message));
            }
            setSubmitAction("harga");
        }

        if (submitAction === "simpan") {
            const th_dp_row = toNum(data?.[0]?.th_dp);
            const payload: any = {
                th_type: 2,
                th_ppn: isPpnIncluded ? 0 : 11,
                supplier: values.supplier,
                cashier: 3,
                th_disc: toNum(values.th_disc),
                th_date: values.th_date,
                th_note: "Test",
                th_payment_type: "BANK",
                th_dp: th_dp_row,
                bank: undefined,
                items: data.map((item) => ({
                    stock: item.stock,
                    stock_code: item.stock_code || "",
                    stock_name: item.stock_name,
                    stock_price_buy: toNum(item.stock_price_buy),
                    quantity: toNum(item.quantity),
                    disc: toNum(item.disc),
                    disc_percent: toNum(item.disc_percent),
                    disc_percent2: toNum(item.disc_percent2),
                })),
            };

            trigger(payload).catch((err) => toast.error(err.message));
            setSubmitAction("bayar");
        }
    }

    // ---------- Default column editor ----------
    const defaultColumn: Partial<ColumnDef<TransactionRow>> = {
        size: 120,
        minSize: 60,
        maxSize: 600,
        cell: ({ getValue, row: { index }, column: { id }, table }) => {
            const initialValue = String(toNum(getValue() as any));
            const [val, setVal] = useState<string>(initialValue);
            useEffect(() => setVal(String(toNum(getValue() as any))), [getValue]);

            const onBlur = () => {
                table.options.meta?.updateData(index, id, toNum(val));
            };

            if (id === "stock_name" || id === "total" || id === "unit" || id === "conversion_unit" || id === "jumlah_pesanan") {
                return <span>{id === "stock_name" ? (getValue() as string) : String(toNum(getValue() as any))}</span>;
            }

            return (
                <div>

                    <input
                        type="number"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        onBlur={onBlur}
                        className="w-full h-full no-spinner bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                </div>
            );
        },
    };

    // ---------- Columns ----------
    const columns = useMemo<ColumnDef<TransactionRow>[]>(() => [
        { header: "Produk", accessorKey: "stock_name", size: 240, minSize: 140 },
        {
            header: "Satuan",
            accessorKey: "unit",
            cell: (info) => <div className="text-left">{String(info.getValue() ?? "")}</div>,
            size: 90, minSize: 60,
        },
        {
            header: "Jns Packing",
            accessorKey: "conversion_unit",
            cell: (info) => <div className="text-left">{String(info.getValue() ?? "")}</div>,
            size: 120, minSize: 80,
        },
        {
            header: "Pesanan",
            accessorKey: "jumlah_pesanan",
            cell: (info) => <div className="text-left">{toNum(info.getValue())}</div>,
            size: 90, minSize: 70,
        },
        { header: "Jml. Barang", accessorKey: "quantity", size: 110 },
        { header: "Harga Beli", accessorKey: "stock_price_buy", size: 130 },
        { header: "Diskon (Rp)", accessorKey: "disc", size: 120 },
        { header: "Diskon (%)", accessorKey: "disc_percent", size: 110 },
        { header: "Diskon 2 (%)", accessorKey: "disc_percent2", size: 120 },
        {
            header: "Total",
            cell: ({ row }) => {
                const price = toNum(row.original.stock_price_buy);
                const qty = toNum(row.original.quantity);
                const disc = toNum(row.original.disc);
                const disc1 = toNum(row.original.disc_percent);
                const disc2 = toNum(row.original.disc_percent2);
                const afterDisc1 = price - disc;
                const afterDisc2 = afterDisc1 - (afterDisc1 * disc1) / 100;
                const afterDisc3 = afterDisc2 - (afterDisc2 * disc2) / 100;
                const subtotal = qty * afterDisc3;
                return <div className="text-left">{subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>;
            },
            size: 140,
        },
        {
            header: "Inc. PPN",
            cell: ({ row }) => {
                const price = toNum(row.original.stock_price_buy);
                const qty = toNum(row.original.quantity);
                const disc = toNum(row.original.disc);
                const disc1 = toNum(row.original.disc_percent);
                const disc2 = toNum(row.original.disc_percent2);
                const afterDisc1 = price - disc;
                const afterDisc2 = afterDisc1 - (afterDisc1 * disc1) / 100;
                const afterDisc3 = afterDisc2 - (afterDisc2 * disc2) / 100;
                const subtotal = qty * afterDisc3;
                const final = isPpnIncluded ? subtotal : subtotal * 1.11;
                return <div className="text-left">{final.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>;
            },
            size: 140,
        },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-center">
                    <Button onClick={() => handleDelete(row.original.id)} className="bg-red-500 hover:bg-red-600 size-7">
                        <Trash />
                    </Button>
                </div>
            ),
            size: 80, minSize: 70, maxSize: 120, enableResizing: true,
        },
    ], [isPpnIncluded]);

    const table = useReactTable({
        data,
        columns,
        defaultColumn,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: "onChange",
        state: { columnSizing, columnSizingInfo },
        onColumnSizingChange: setColumnSizing,
        onColumnSizingInfoChange: setColumnSizingInfo,
        meta: {
            updateData: (rowIndex, columnId, value) => {
                const v = toNum(value);
                dispatch(
                    setTableData({
                        tableName,
                        data: data.map((row, index) => {
                            if (index === rowIndex) {
                                const updated = { ...row, [columnId]: v };
                                const price = toNum(updated.stock_price_buy);
                                const qty = toNum(updated.quantity);
                                const disc = toNum(updated.disc);
                                const d1 = toNum(updated.disc_percent);
                                const d2 = toNum(updated.disc_percent2);
                                const a1 = price - disc;
                                const a2 = a1 - (a1 * d1) / 100;
                                const a3 = a2 - (a2 * d2) / 100;
                                updated.subtotal = qty * a3;
                                return updated;
                            }
                            return row;
                        }),
                    })
                );
            },
        },
    });

    useEffect(() => {
        if (data.length === 0) {
            dispatch(setTableData({ tableName: "transaksi", data: [] }));
        }
    }, [dispatch, data.length]);

    const handleCheckboxChange = (checked: boolean) => setIsPpnIncluded(!!checked);

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowId: number, field: keyof TransactionRow) => {
    //     const value = toNum(e.target.value);
    //     if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    //     debounceTimeout.current = setTimeout(() => {
    //         const updatedData = data.map((item) => {
    //             if (item.id === rowId) {
    //                 const u: TransactionRow = { ...item, [field]: value } as TransactionRow;
    //                 const price = toNum(u.stock_price_buy);
    //                 const qty = toNum(u.quantity);
    //                 const disc = toNum(u.disc);
    //                 const d1 = toNum(u.disc_percent);
    //                 const d2 = toNum(u.disc_percent2);
    //                 const a1 = price - disc;
    //                 const a2 = a1 - (a1 * d1) / 100;
    //                 const a3 = a2 - (a2 * d2) / 100;
    //                 u.subtotal = qty * a3;
    //                 return u;
    //             }
    //             return item;
    //         });
    //         dispatch(setTableData({ tableName: "transaksi", data: updatedData }));
    //     }, 200);
    // };

    // Ringkasan total
    const totalSummary = useMemo(() => {
        const subtotal = data.reduce((acc, item) => {
            const price = toNum(item.stock_price_buy);
            const qty = toNum(item.quantity);
            const disc = toNum(item.disc);
            const disc1 = toNum(item.disc_percent);
            const disc2 = toNum(item.disc_percent2);
            const afterDisc1 = price - disc;
            const afterDisc2 = afterDisc1 - (afterDisc1 * disc1) / 100;
            const afterDisc3 = afterDisc2 - (afterDisc2 * disc2) / 100;
            return acc + qty * afterDisc3;
        }, 0);

        const discNota = toNum(form.watch("th_disc"));
        const totalPPN = isPpnIncluded ? 0 : subtotal * 0.11;
        const totalAfterPPN = subtotal + totalPPN;
        const totalFinal = Math.max(totalAfterPPN - discNota, 0);

        return { subtotal, totalPPN, totalAfterPPN, totalFinal };
    }, [data, isPpnIncluded, form.watch("th_disc")]);

    // Actions
    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };
    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    // Search (Enter)
    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim() !== "") {
            setSearchLoading(true);
            try {
                const res = await fetcher(`/api/proxy/api/stock/?search=${searchQuery.trim()}`);
                if (!res || res.length === 0) {
                    toast.error("Produk tidak ditemukan");
                } else {
                    if (res.length > 1) toast.info(`Ditemukan ${res.length} produk, menambahkan produk pertama.`);
                    const product = res[0];
                    handleAddProduct({
                        id: product.id,
                        barcode: product.barcode,
                        code: product.code,
                        name: product.name,
                        price_buy: Number(product.price_buy),
                        unit_name: product.unit_name,
                        conversion_unit: product.conversion_unit,
                        jumlah_barang: 1,
                    });
                }
            } catch (err: any) {
                toast.error(err.message || "Gagal mencari produk");
            }
            setSearchLoading(false);
            setSearchQuery("");
        }
    };

    // Tambah produk
    const handleAddProduct = (product: any) => {
        const qty = toNum(product.jumlah_barang ?? 1);
        const price = toNum(product.price_buy);
        const a1 = price - 0;
        const a2 = a1 - (a1 * 0) / 100;
        const a3 = a2 - (a2 * 0) / 100;
        const subtotal = qty * a3;

        const newItem: TransactionRow = {
            id: Date.now(),
            stock: product.id,
            stock_code: product.code,
            stock_name: product.name,
            jumlah_pesanan: 0,
            quantity: qty,
            stock_price_buy: price,
            unit: product.unit_name,
            conversion_unit: product.conversion_unit,
            disc: 0,
            disc_percent: 0,
            disc_percent2: 0,
            subtotal,
        };

        toast.success(product.name + " Berhasil Ditambahkan");
        dispatch(addRow({ tableName, row: newItem }));
    };

    return (
        <div className="flex flex-col space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <div className="flex justify-between gap-4 mb-2">
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
                                                                ? format(new Date(field.value), "dd/MM/yyyy", { locale: localeId })
                                                                : <span>Pilih Tanggal</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(d) => field.onChange(d?.toISOString() ?? new Date().toISOString())}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
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
                                                        setSupplier(val);
                                                        field.onChange(val ?? undefined);
                                                        setSupplierName(label || "");
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
                                            <FormLabel>Diskon Nota</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={String(toNum(field.value))}
                                                    onChange={(e) => field.onChange(toNum(e.target.value))}
                                                    className="bg-gray-100 w-[150px] h-[30px] no-spinner"
                                                    placeholder="0"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-2 items-center pb-2">
                                <Checkbox
                                    id="ppn"
                                    checked={isPpnIncluded}
                                    onCheckedChange={handleCheckboxChange}
                                    className="size-5 items-center"
                                />
                                <label htmlFor="ppn" className="text-sm font-medium leading-none">
                                    Termasuk PPN
                                </label>
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Pesanan</Button>
                                </DialogTrigger>
                                <DialogContent className="w-full max-h-[90vh]">
                                    <TpModal />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isTambahProdukModalOpen} onOpenChange={setIsTambahProdukModalOpe}>
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

                            <Button onClick={handleClear} variant="outline" className="font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                                Batal
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-end justify-end">
                        <div className="flex items-end">
                            <div
                                className={cn(
                                    "w-[297px]",
                                    "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                )}
                            >
                                <Search size={20} style={{ marginRight: "10px" }} />
                                <input
                                    type="text"
                                    placeholder="Cari Produk (ID/Kode)"
                                    style={{ border: "none", outline: "none", flex: "1" }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    disabled={searchLoading}
                                />
                                {searchLoading && <span className="ml-2 animate-spin">🔄</span>}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <ScrollArea className="relative z-0 h-[calc(100vh-300px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
                        <div className="min-w-full rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-100 sticky top-0 z-10">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="h-[40px]">
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    style={{ width: header.getSize?.() ?? undefined }}
                                                    className="relative text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100 whitespace-nowrap"
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}

                                                    {/* Resize handle */}
                                                    {header.column.getCanResize?.() && (
                                                        <div
                                                            onMouseDown={header.getResizeHandler()}
                                                            onTouchStart={header.getResizeHandler()}
                                                            className={cn(
                                                                "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none",
                                                                header.column.getIsResizing?.() ? "bg-blue-500" : "bg-transparent",
                                                            )}
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
                                            <TableRow key={row.id} className="h-[40px]">
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        style={{ width: cell.column.getSize?.() ?? undefined }}
                                                        className="text-left p-2 border-b border-r last:border-r-0 whitespace-nowrap"
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
                                    <TableRow className="h-[40px]">
                                        {table.getHeaderGroups()[0].headers.map((header, index) => {
                                            const column = header.column;
                                            let content: React.ReactNode = "";
                                            switch (index) {
                                                case 2:
                                                    content = "Total Barang:";
                                                    break;
                                                case 3:
                                                    content = data.reduce((acc, item) => acc + toNum(item.jumlah_pesanan), 0);
                                                    break;
                                                case 4:
                                                    content = data.reduce((acc, item) => acc + toNum(item.quantity), 0);
                                                    break;
                                                case 8:
                                                    content = "Total:";
                                                    break;
                                                case 9:
                                                    content = totalSummary.subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                                    break;
                                                case 10:
                                                    content = totalSummary.totalAfterPPN.toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                                    break;
                                            }
                                            return (
                                                <TableCell
                                                    key={column.id}
                                                    style={{ width: column.getSize?.() ?? undefined }}
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
                        <ScrollBar orientation="vertical" className="z-40" />
                    </ScrollArea>


                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4">
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
                                <Button className="font-medium bg-blue-500 hover:bg-blue-600" type="button">
                                    Simpan
                                </Button>
                            )}

                            <DialogContent className="w-1/4 max-h-11/12" onInteractOutside={(e) => e.preventDefault()}>
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
                            <DialogContent className="w-12/12 h-11/12 max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
                                <GantiHargaModal priceData={pricesData} onClose={() => setIsGantiHargaModalOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default TransactionTable;
