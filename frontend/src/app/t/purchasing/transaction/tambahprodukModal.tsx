"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp, ArchiveRestore } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    SortingState,
    Row,
} from "@tanstack/react-table";
import { toast } from "sonner";
import useSWR from "swr";
import { cn, fetcher } from "@/lib/utils";

import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Description } from "@radix-ui/react-dialog";
import { DistributorDropdown } from "@/components/dropdown-checkbox/distributor-dropdown";
import { CategoryDropdown } from "@/components/dropdown-checkbox/category-dropdown";
import Loading from "@/components/loading";
import { Stock } from "./persediaanModal";

interface TambahProdukModalProps {
    tableName: string;
    onClose: () => void;
    onOpenNext: () => void;
    openPersediaanModalWithStock: (stock: Stock) => void;
    openPersediaanModal: () => void;
}


const TambahProdukModalTP: React.FC<TambahProdukModalProps> = ({ tableName, onClose, onOpenNext, openPersediaanModalWithStock, openPersediaanModal }) => {
    const dispatch = useDispatch();
    const [search, setSearch] = useState("");
    const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
    const [distributor, setDistributor] = useState<number[]>([]);
    const supplierParam = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";
    // const category = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";

    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const { data, error, isLoading, mutate } = useSWR(
  `/api/proxy/api/stock/?include_sales=true${supplierParam}`,
  fetcher
);


    const handleAddProduct = (product: any) => {
        const subtotal = (product.jumlah_barang ?? 1) * product.price_buy;
        const newItem = {
            stock: product.id,
            barcode: product.barcode,
            stock_code: product.code,
            stock_name: product.name,
            jumlah_pesanan: 0,
            quantity: product.jumlah_barang ?? 1,
            stock_price_buy: product.price_buy,
            unit: product.unit_name,
            conversion_unit: product.conversion_unit
        };
        toast.success(product.name + " Berhasil Ditambahkan");
        dispatch(addRow({ tableName, row: newItem }));
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => (
                    <div
                        className="flex items-center gap-2 cursor-pointer w-96"
                        onClick={() =>
                            setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
                        }
                    >
                        Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                    </div>
                ),
            },

            { accessorKey: "available_quantity", header: "Jum.Stok" },
            {
                accessorKey: "price_buy",
                header: "H.B",
                cell: (info: any) => `Rp${info.getValue().toLocaleString("id-ID")}`,
            },
            { accessorKey: "sales_quantity_week", header: "J(7)" },
            { accessorKey: "sales_quantity_month", header: "J(28)" },
            { accessorKey: "purchase_quantity_week", header: "B(7)" },
            { accessorKey: "purchase_quantity_month", header: "J(28)" },
            {
                header: "H.J1",
                accessorFn: (row: { prices: { price_sell: any }[] }) =>
                    row.prices?.[0]?.price_sell ? `Rp${Number(row.prices[0].price_sell).toLocaleString("id-ID")}` : "-",
            },
            {
                header: "H.J2",
                accessorFn: (row: { prices: { price_sell: any }[] }) =>
                    row.prices?.[1]?.price_sell ? `Rp${Number(row.prices[1].price_sell).toLocaleString("id-ID")}` : "-",
            },
            {
                header: "H.J3",
                accessorFn: (row: { prices: { price_sell: any }[] }) =>
                    row.prices?.[2]?.price_sell ? `Rp${Number(row.prices[2].price_sell).toLocaleString("id-ID")}` : "-",
            },
            {
                accessorKey: "last_buy",
                header: "T.Beli",
                cell: ({ getValue }) => {
                    const rawValue = getValue();
                    if (!rawValue || typeof rawValue !== 'string') return "-";
                    const parsedDate = new Date(rawValue);
                    if (isNaN(parsedDate.getTime())) return "-";
                    return format(parsedDate, "d/M/yyyy", { locale: id });
                },
            },
            {
                accessorKey: "last_sell",
                header: "T.Jual",
                cell: ({ getValue }) => {
                    const rawValue = getValue();
                    if (!rawValue || typeof rawValue !== 'string') return "-";
                    const parsedDate = new Date(rawValue);
                    if (isNaN(parsedDate.getTime())) return "-";
                    return format(parsedDate, "d/M/yyyy", { locale: id });
                },
            },

            {
                accessorKey: "Action",
                header: "Aksi",
                cell: ({ row }: { row: Row<any> }) => {
                    const product = row.original;
                    const [quantity, setQuantity] = useState(product.jumlah_barang || "");

                    const updateQuantity = (val: number | string) => {
                        if (val === "") {
                            setQuantity(""); // Allow empty value
                            row.original.jumlah_barang = ""; // Store empty value if needed
                        } else {
                            const value = Math.max(0, Number(val)); // Ensure non-negative numbers
                            setQuantity(value);
                            row.original.jumlah_barang = value; // Update the quantity in row
                        }
                    };

                    return (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded">
                                <input
                                    type="number"
                                    value={quantity}
                                    placeholder="1"
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        updateQuantity(newValue); // Directly update based on input value
                                    }}
                                    className="w-10 h-8 bg-gray-200 text-center outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    min={0}
                                />
                            </div>
                            <Button
                                onClick={() => handleAddProduct(row.original)}
                                className="bg-blue-500 hover:bg-blue-600 size-7"
                            >
                                <Plus />
                            </Button>
                            <Button
                                onClick={() => openPersediaanModalWithStock(row.original)}
                                className="bg-green-500 hover:bg-green-600 size-7"
                            >
                                <ArchiveRestore />
                            </Button>


                        </div >
                    );
                },
                enableSorting: false,
            }

        ],
        [sorting]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { sorting, globalFilter: search },
        onSortingChange: setSorting,
        onGlobalFilterChange: setSearch,
    });

    return (
        <div>
            <DialogHeader>
                <DialogTitle>Tambah Produk</DialogTitle>
                <Description></Description>
            </DialogHeader>


            <div>
                <div className="flex justify-between">
                    <div className=" flex">
                        <div className="my-2 relative w-56">
                            <DistributorDropdown onChange={(ids) => setDistributor(ids)} />
                        </div>
                        <div className="my-2 relative w-56">
                            <CategoryDropdown />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div>
                            <Button
                                className="bg-green-500 hover:bg-green-600 "
                                onClick={() => openPersediaanModal()}
                            >
                                <ArchiveRestore />
                                Persediaan
                            </Button>

                        </div>
                        <div className="my-2 relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Cari"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10"
                            />
                        </div>
                    </div>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)] max-w-screen overflow-x-auto overflow-y-auto  rounded-t-md">
                    <div className="w-[90vw] text-sm border-separate border-spacing-0 min-w-full ">
                        <Table className=" bg-white rounded-md">
                            <TableHeader className="sticky top-0  z-20 bg-gray-100 ">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className=" ">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className={cn(
                                                "text-left font-bold text-black p-2 border-b border-r last:border-r-0  ",
                                                header.id === "barcode" && "w-[120px]",
                                                header.id === "name" && "w-[200px]",
                                                header.id === "jumlah" && "w-[120px]",
                                                header.id === "action" &&
                                                "sticky right-0 z-30 bg-gray-100 w-[50px]"
                                            )}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center">
                                            <Loading />
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center text-red-500">

                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row, rowIndex) => (
                                        <TableRow key={row.id} className="bg-white">
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className={cn(
                                                        "text-left truncate w-[85px] p-2 border-b border-r first:border-l last:border-r", rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100',
                                                        cell.column.id === "barcode" && "w-[120px]",
                                                        cell.column.id === "name" && "w-[200px]",
                                                        cell.column.id === "jumlah" && "w-[120px]",
                                                        cell.column.id === "action" &&
                                                        "sticky right-0 z-20 bg-white w-[50px]"
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center text-gray-400">
                                            Tidak ada produk ditemukan
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

        </div>
    );
};

export default TambahProdukModalTP;
