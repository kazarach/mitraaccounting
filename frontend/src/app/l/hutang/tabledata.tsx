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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronsUpDown, ChevronUp, Copy, DollarSign, Eye, Search, Trash, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

import useSWR from 'swr';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, flexRender, SortingState, getFacetedRowModel, getFilteredRowModel, getFacetedUniqueValues } from '@tanstack/react-table';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import DetailPiutangModal from '@/app/l/piutang/hutang-detailHutang-modal';
import Loading from '@/components/loading';
import DetailHutangModal from './hutang-detailHutang-modal';

const HutangTable = () => {
    const [status, setStatus] = useState('all');
    const [sorting, setSorting] = useState<SortingState>([
        { id: "supplier_name", desc: false },
    ]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const API_URL = process.env.NEXT_PUBLIC_API_URL!;
    const { data, error, isLoading, mutate } = useSWR(
        [API_URL, status],
        () => {
            const statusParam = status !== "all" ? `&is_settled=${status}` : "";
            return fetcher(
                `${API_URL}api/araps/?is_receivable=false${statusParam}`
            );
        }
    );
    // console.log(data)

    // const tableData = Array.isArray(data)
    //     ? [...data].sort((a, b) => a.customer_name.localeCompare(b.customer_name))
    //     : [];


    const columns: ColumnDef<any>[] = [
        {
            header: "Nama Supplier",
            accessorKey: "supplier_name",
            size: 300,
            enableSorting: true,
            filterFn: "includesString",
        },

        { header: "Sisa Hutang", accessorKey: "remaining_amount" },
        { header: "Jumlah Hutang", accessorKey: "total_arap" },
        {
            header: "Action",
            cell: ({ row }) => {
                const [open, setOpen] = useState(false);
                const selectedId = row.original.id;

                return (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-blue-500 hover:bg-blue-600 size-7"
                                onClick={() => setOpen(true)}
                            >
                                <Eye />
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Detail Hutang</DialogTitle>
                                <DialogDescription></DialogDescription>
                            </DialogHeader>

                            <DetailHutangModal id={selectedId} onClose={() => setOpen(false)} />
                        </DialogContent>
                    </Dialog>
                );
            }
        }
    ];


    const table = useReactTable({
        data: data || [],
        columns,
        state: {
            sorting,
            globalFilter: search,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setSearch,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });



    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="status">Status Hutang</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="relative w-[150px] h-[30px] bg-gray-100">
                                <SelectValue placeholder="Umur Hutang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="true">Lunas</SelectItem>
                                <SelectItem value="false">Belum Lunas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-end">
                    <div className="flex items-end gap-2">
                        <div
                            className={cn(
                                "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            )}
                        >
                            <Search size={20} style={{ marginRight: "10px" }} />
                            <input
                                placeholder="Cari"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ border: "none", outline: "none", flex: "1" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-md border overflow-auto">
                <ScrollArea className="w-full max-h-[400px] overflow-auto">
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
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className="cursor-pointer select-none flex items-center gap-1"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: <ChevronUp size={16} />,
                                                        desc: <ChevronDown size={16} />,
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            )}
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
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center text-red-500 bg-gray-200"
                                    >
                                        Error: {error.message || "Gagal mengambil data"}
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows.length ? (
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
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center text-gray-400 bg-gray-200"
                                    >
                                        Tidak ada Hutang
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
};

export default HutangTable; 