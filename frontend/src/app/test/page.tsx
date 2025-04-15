// TambahProdukModal.js
"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { products } from "@/data/product";
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
import { Card } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => {

    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (access) {
        headers["Authorization"] = `Bearer ${access}`;
    }
    if (refresh) {
        headers["x-refresh-token"] = refresh;
    }

    return fetch(url, { headers }).then((res) => res.json());
};


interface TambahProdukModalProps {
    tableName: string;
}

const TestPanggil: React.FC<TambahProdukModalProps> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [search, setSearch] = useState("");
    const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
    const [quantities, setQuantities] = useState<Record<string, number>>({}); // Track quantities for each row

    const handleAddProduct = (product: any) => {
        const newItem = {
            name: product.name,
            jumlah_pesanan: "-",
            jumlah_barang: product.jumlah_barang ?? 1,
            harga_beli: product.purchasePrice,
            subtotal: product.purchasePrice * (product.jumlah_pesanan ?? 1),
        };
        toast.success(product.name + " Berhasil Ditambahkan");
        dispatch(addRow({ tableName, row: newItem }));
    };

    const { data, error, isLoading } = useSWR("http://127.0.0.1:8000/api/stock/", fetcher);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Terjadi kesalahan</p>;

    const handleQuantityChange = (productId: string, value: number) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: Math.max(1, value),
        }));
    };

    const columns = [
        {
            accessorKey: "name",
            header: () => (
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() =>
                        setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
                    }
                >
                    Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
                </div>
            ),
        },
        { accessorKey: "barcode", header: "Barcode" },
        { accessorKey: "quantityOutput", header: "Jumlah Stok" },
        { accessorKey: "boughtLast7Days", header: "Terbeli (7H)" },
        { accessorKey: "boughtLast30Days", header: "Terbeli (30H)" },
        { accessorKey: "soldLast7Days", header: "Terjual (7H)" },
        { accessorKey: "soldLast30Days", header: "Terjual (30H)" },
        {
            accessorKey: "purchasePrice",
            header: "Harga Beli",
            cell: (info: any) => `Rp${info.getValue().toLocaleString("id-ID")}`,
        },
        {
            accessorKey: "jumlahInput",
            header: "Jumlah",
            cell: ({ row }: { row: Row<any> }) => {
                const productId = row.id; // Unique identifier for the row
                const quantity = quantities[productId] ?? row.original.jumlah_barang ?? 1; // Default to product quantity if no quantity set

                const updateQuantity = (val: number) => {
                    handleQuantityChange(productId, val);
                };

                const increment = () => updateQuantity(quantity + 1);
                const decrement = () => updateQuantity(quantity - 1);

                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={decrement}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            −
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(productId, Math.max(1, Number(e.target.value)))}
                            className="w-12 text-center border rounded"
                            min={1}
                        />
                        <button
                            onClick={increment}
                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            +
                        </button>
                    </div>
                );
            },
            enableSorting: false,
        },
        {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }: { row: Row<any> }) => (
                <Button onClick={() => handleAddProduct(row.original)} className="bg-blue-500 hover:bg-blue-600 size-7">
                    <Plus />
                </Button>
            ),
            enableSorting: false,
        },
    ];

    const table = useReactTable({
        data: data,
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
            <Card className="p-4">
                <div className="my-2 relative w-1/4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Cari Produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10"
                    />
                </div>
                <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[68vh] bg-white relative">
                    <Table className="w-full min-w-[1000px] bg-white">
                        <TableHeader className="sticky top-0 bg-gray-100 z-20">
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
                            {table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="bg-white">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-left">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};


export default TestPanggil;