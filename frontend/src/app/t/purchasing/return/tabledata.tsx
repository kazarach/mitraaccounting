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
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
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
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import TambahProdukModalret from './tambahProdukModal';
import useSWR from 'swr';

interface Props {
    tableName: string;
}

const ReturTransTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = useState<Date>(new Date());
    const [isPpnIncluded, setIsPpnIncluded] = useState(true);
    const data = useSelector((state: RootState) => state.table[tableName] || []);
    const [returnQTYMap, setReturnQTYMap] = useState<{ [key: number]: number }>({});
    const [reviewData, setReviewData] = useState<any>(null);
    const [supplier, setSupplier] = useState<number | null>(null);
    const [supplierName, setSupplierName] = useState<string>("");

   

    useEffect(() => {
        if (data.length > 0) {
            setReturnQTYMap(prev => {
                const newMap = { ...prev };
                data.forEach(item => {
                    if (!(item.id in newMap)) {
                        newMap[item.id] = typeof item.returnQty === "number" ? item.returnQty : 1;
                    }
                });
                Object.keys(newMap).forEach(key => {
                    if (!data.find(item => item.id === Number(key))) {
                        delete newMap[Number(key)];
                    }
                });
                return newMap;
            });
        } else {
            setReturnQTYMap({});
        }
    }, [data]);



    const handleReturnQTYChange = (id: number, value: number) => {
        setReturnQTYMap(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };

    const columns: ColumnDef<any>[] = [
        { header: "Produk", accessorKey: "stock_name" },
        { header: "Jumlah barang", accessorKey: "quantity" },
        {
            header: "Jumlah Return",
            cell: ({ row }) => {
                const id = row.original.id;
                const value = returnQTYMap[id] ?? 0;
                // const value = row.original.returnQty ?? 0;
                return (
                    <input
                        type="number"
                        min={0}
                        defaultValue={value}
                        className="pl-1 text-left bg-gray-100 rounded-sm w-24"
                        onBlur={e => {
                            let newValue = Number(e.target.value);
                            if (newValue < 0) newValue = 0;
                            handleReturnQTYChange(id, newValue);
                        }}
                    />
                );
            },
            size: 80,
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
            cell: ({ row }) => {
                const id = row.original.id;
                const qty = returnQTYMap[id] ?? 0;
                const price = row.original.stock_price_buy || 0;
                const total = qty * price;
                return `Rp${total.toLocaleString("id-ID")}`;
            }
        },
        {
            header: "Inc. PPN",
            cell: ({ row }) => {
                const id = row.original.id;
                const price = row.original.stock_price_buy || 0;
                const qty = returnQTYMap[id] || 0;

                const subtotal = qty * price;
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
                <Button
                    onClick={() => handleDelete(row.original.id)}
                    className="bg-red-500 hover:bg-red-600 size-7"
                >
                    <Trash />
                </Button>
            ),
        },
    ];

    const API_URL = process.env.NEXT_PUBLIC_API_URL!;

    const { trigger, data: review } = useSWRMutation<any, any, string, any>(
        `/api/proxy/api/transactions/calculate_preview/`,
        fetcherPost
    );

    const { data : me, error, isLoading, mutate } = useSWR(`/api/proxy/api/users/me/`, fetcher);
    

    const onSubmit = async () => {
        const payload = {
            th_type: 2,
            cashier: me.id,
            th_date: date.toISOString() || "",
            th_note: "",
            th_payment_type: "CASH",
            items: data.map(item => ({
                stock: item.stock,
                stock_code: item.stock_code || "",
                stock_name: item.stock_name,
                stock_price_buy: item.stock_price_buy,
                quantity: returnQTYMap[item.id] ?? 0,
                disc: item.disc || 0,
                disc_percent: item.disc_percent || 0,
                disc_percent2: item.disc_percent2 || 0,
            }))
        };
        console.log(JSON.stringify(payload, null, 1));
        trigger(payload)
            .then((res) => {
                console.log(res);
            })
            .catch((err) => {
                toast.error(err.message);
            });
    };

    useEffect(() => {
        if (review) {
            const th_dp = data?.[0]?.th_dp || 0;
            const updatedReview = {
                ...review,
                th_dp,
                date,
                returnQTYMap,
                isPpnIncluded,
                supplier,
                
            };
            setReviewData(updatedReview);
        }
    }, [review, data]);

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

    const totalSummary = useMemo(() => {
        const subtotal = data.reduce((acc, item) => {
            const qty = returnQTYMap[item.id] ?? 0;
            const price = item.stock_price_buy || 0;
            return acc + (qty * price);
        }, 0);
        return { subtotal };
    }, [data, returnQTYMap]);

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
                                        ? format(date, "d MMMM yyyy", { locale: id })
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
                                <span>{totalSummary.subtotal.toLocaleString("id-ID", {
                                    maximumFractionDigits: 2,
                                })}</span>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
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
