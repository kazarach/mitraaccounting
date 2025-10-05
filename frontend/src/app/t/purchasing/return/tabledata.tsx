"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
    Table, TableBody, TableCell, TableFooter, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { toast } from 'sonner';
import { ColumnDef, flexRender, getCoreRowModel, RowData, useReactTable } from '@tanstack/react-table';
import { CalendarIcon, Trash } from 'lucide-react';
import BayarTPModal from './bayarModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher, fetcherPost } from '@/lib/utils';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import useSWRMutation from 'swr/mutation';
import DistributorDD from '@/components/dropdown-normal/distributor_dd';
import PembelianModal from './pembelianModal';
import TambahProdukModalret from './tambahProdukModal';
import useSWR from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

declare module "@tanstack/react-table" {
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void
    }
}

const toNum = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

interface Props {
    tableName: string;
}

const ReturTransTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = useState<Date>(new Date());
    const [isPpnIncluded, setIsPpnIncluded] = useState(true);
    const data = useSelector((state: RootState) => state.table[tableName] || []);
    const [reviewData, setReviewData] = useState<any>(null);
    const [supplier, setSupplier] = useState<number | null>(null);
    const [supplierName, setSupplierName] = useState<string>("");
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
    const [columnSizingInfo, setColumnSizingInfo] = useState<any>({});

    // Pastikan setiap row memiliki returnQty (default 0) dan subtotal terhitung
    useEffect(() => {
        if (!data?.length) return;
        let changed = false;
        const normalized = data.map((row: any) => {
            const rq = typeof row.returnQty === "number" ? row.returnQty : 0;
            const price = Number(row.stock_price_buy ?? 0);
            const newSubtotal = rq * price;
            if (row.returnQty !== rq || row.subtotal !== newSubtotal) {
                changed = true;
                return { ...row, returnQty: rq, subtotal: newSubtotal };
            }
            return row;
        });
        if (changed) {
            dispatch(setTableData({ tableName, data: normalized }));
        }
    }, [data, dispatch, tableName]);

    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };

    const defaultColumn: Partial<ColumnDef<any>> = {
        size: 120,
        minSize: 60,
        maxSize: 600,
        cell: ({ getValue, row: { index }, column, table }) => {
            const raw = getValue() as any;
            const isEditable = (column.columnDef as any)?.meta?.editable === true;

            if (!isEditable) {
                return <span className="text-gray-700">{typeof raw === "number" ? String(toNum(raw)) : String(raw ?? "")}</span>;
            }

            const initialValue = String(toNum(raw));
            const [val, setVal] = React.useState<string>(initialValue);
            useEffect(() => setVal(String(toNum(getValue() as any))), [getValue]);

            const onBlur = () => table.options.meta?.updateData(index, column.id, toNum(val));

            return (
                <div className=" rounded px-1 py-0.5 focus-within:ring-2 focus-within:ring-gray-300">
                    <input
                        type="number"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        onBlur={onBlur}
                        className="w-full h-full bg-transparent outline-none no-spinner appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                </div>
            );
        },
    };


    const columns = useMemo<ColumnDef<any>[]>(() => [
        { header: "Produk", accessorKey: "stock_name" },
        { header: "Jumlah barang", accessorKey: "quantity" },
        {
            header: "Jumlah Return",
            accessorKey: "returnQty",
            size: 100,
            meta: { editable: true },
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
            header: "Subtotal",
            accessorKey: "subtotal",
            cell: ({ row }) => `Rp${Number(row.original.subtotal ?? 0).toLocaleString("id-ID")}`
        },
        {
            header: "Inc. PPN",
            id: "inc_ppn",
            cell: ({ row }) => {
                const qty = Number(row.original.returnQty ?? 0);
                const price = Number(row.original.stock_price_buy ?? 0);
                const subtotal = qty * price;
                const final = isPpnIncluded ? subtotal : subtotal * 1.11;
                return (
                    <div className="text-left">
                        {final.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                );
            },
            size: 100
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
    ], []);

    const { trigger, data: review } = useSWRMutation<any, any, string, any>(
        `/api/proxy/api/transactions/calculate_preview/`,
        fetcherPost
    );

    const { data: me } = useSWR(`/api/proxy/api/users/me/`, fetcher);

    const onSubmit = async () => {
        const payload = {
            th_type: 2,
            cashier: me?.id, // aman bila me belum ready
            th_date: date?.toISOString() || "",
            th_note: "",
            th_payment_type: "CASH",
            items: data.map((item: any) => ({
                stock: item.stock,
                stock_code: item.stock_code || "",
                stock_name: item.stock_name,
                stock_price_buy: item.stock_price_buy,
                quantity: Number(item.returnQty ?? 0), // gunakan returnQty
                disc: item.disc || 0,
                disc_percent: item.disc_percent || 0,
                disc_percent2: item.disc_percent2 || 0,
            }))
        };
        try {
            await trigger(payload);
        } catch (err: any) {
            toast.error(err?.message ?? "Gagal menghitung preview transaksi");
        }
    };

    useEffect(() => {
        if (review) {
            const th_dp = data?.[0]?.th_dp || 0;
            setReviewData({
                ...review,
                th_dp,
                date,
                isPpnIncluded,
                supplier,
            });
        }
    }, [review, data, date, isPpnIncluded, supplier]);

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
            updateData: (rowIndex: number, columnId: string, value: unknown) => {
                const next = data.map((row: any, idx: number) => {
                    if (idx !== rowIndex) return row;

                    const v =
                        typeof value === "string" && value.trim() === ""
                            ? 0
                            : Number.isFinite(Number(value))
                                ? Number(value)
                                : value;

                    const currentQty = Number(row.returnQty ?? 0);
                    const currentPrice = Number(row.stock_price_buy ?? 0);

                    const newReturnQty = columnId === "returnQty" ? Number(v) : currentQty;
                    const newPrice = columnId === "stock_price_buy" ? Number(v) : currentPrice;

                    return {
                        ...row,
                        [columnId]: v,
                        subtotal: newReturnQty * newPrice, // subtotal retur
                    };
                });

                dispatch(setTableData({ tableName, data: next }));
            },
        },
    });

    useEffect(() => {
        if (data.length === 0) {
            dispatch(setTableData({
                tableName,
                data: [],
            }));
        }
    }, [dispatch, data.length, tableName]);

    const totalSummary = useMemo(() => {
        const subtotal = data.reduce((acc: number, item: any) => {
            const qty = Number(item.returnQty ?? 0);
            const price = Number(item.stock_price_buy ?? 0);
            return acc + (qty * price);
        }, 0);
        return { subtotal };
    }, [data]);

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
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="date">Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[150px] h-[30px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date
                                        ? format(date, "dd/MM/yyyy", { locale: id })
                                        : <span>Pilih Tanggal</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={val => setDate(val ?? date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-col ">
                        <Label className='mb-2' htmlFor="supplier">Supplier</Label>
                        <DistributorDD
                            value={supplier}
                            onChange={(val: number | null, label: string | null) => {
                                setSupplier(val);
                                setSupplierName(label || "");
                            }}
                        />
                    </div>
                    <div className="flex gap-2 items-center pb-2">
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
                            <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Pembelian</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[100vw] max-h-[90vh]">
                            <PembelianModal tableName={tableName} />
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[100vw] max-h-[90vh]">
                            <TambahProdukModalret tableName={tableName} />
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>
                </div>
            </div>

            <ScrollArea className="relative z-0 h-[calc(100vh-300px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
                <div className="min-w-full">
                    <Table>
                        <TableHeader className="bg-gray-100 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="h-[40px]">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: (header as any).getSize?.() ?? undefined }}
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
                                        {row.getVisibleCells().map((cell) => {
                                            const isEditableCol = (cell.column.columnDef as any)?.meta?.editable === true;
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    style={{ width: (cell.column as any).getSize?.() ?? undefined }}
                                                    className={cn(
                                                        "text-left p-2 border-b border-r last:border-r-0 whitespace-nowrap",
                                                        isEditableCol && "bg-gray-100"
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
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
                                    <span>{totalSummary.subtotal.toLocaleString("id-ID", {
                                        maximumFractionDigits: 2,
                                    })}</span>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" className="z-40" />
            </ScrollArea>

            <div className='flex justify-end gap-2 mt-4 '>
                <Dialog>
                    {data.length > 0 ? (
                        <DialogTrigger asChild>
                            <Button
                                className="font-medium bg-blue-500 hover:bg-blue-600"
                                type="button"
                                onClick={onSubmit}
                            >
                                Simpan
                            </Button>
                        </DialogTrigger>
                    ) : (
                        <Button
                            className='font-medium bg-blue-500 hover:bg-blue-600'
                            onClick={() => toast.error("Silakan tambahkan produk terlebih dahulu")}
                        >
                            Simpan
                        </Button>
                    )}

                    <DialogContent className="w-1/4 max-h-11/12">
                        <BayarTPModal review={reviewData} supplier_name={supplierName} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default ReturTransTable;
