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
import { CalendarIcon, Check, ChevronsUpDown, Copy, DollarSign, Eye, Search, Trash, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';

import useSWR from 'swr';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, flexRender, SortingState } from '@tanstack/react-table';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import DetailPiutangModal from '@/app/l/piutang/hutang-detailHutang-modal';
import Loading from '@/components/loading';
import { Description } from '@radix-ui/react-dialog';

const PiutangTable = () => {
    const [search, setSearch] = useState("");
    const [umurHutang, setUmurHutang] = useState('all');
    const [status, setStatus] = useState('all');
    const [sorting, setSorting] = useState<SortingState>([]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL!;



    const { data = [], error, isLoading, mutate } = useSWR(
        [API_URL,  status],
        () => {
            const statusParam = status !== "all" ? `&is_settled=${status}` : "";

            return fetcher(
                `${API_URL}api/araps/?is_receivable=true${statusParam}`
            );
        }
    );

    


    const tableData = Array.isArray(data)
        ? [...data].sort((a, b) => a.customer_name.localeCompare(b.customer_name))
        : [];


    const columns: ColumnDef<any>[] = [
        {
            header: "Nama Pelanggan",
            accessorKey: "customer_name",
            size: 300,
            enableSorting: true,
        },

        { header: "Sisa Piutang", accessorKey: "remaining_amount" },
        { header: "Jumlah Piutang", accessorKey: "total_arap" },
        {
            header: "Action",
            cell: ({ row }) => {
                const id = row.original.id
                return (
                    <Dialog >

                        <DialogTrigger asChild>
                            <Button className="bg-blue-500 hover:bg-blue-600 size-7">
                                <Eye />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <Description></Description>
                                <DetailPiutangModal id={id} />
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                )
            }
        },
    ];


    const table = useReactTable({
        data: tableData,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="date">Status Piutang</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="relative w-[150px] h-[30px] bg-gray-100 ">
                                <SelectValue placeholder="Umur Hutang" className='' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="true">Lunas</SelectItem>
                                <SelectItem value="false">Belum Lunas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className='flex items-end'>
                    <div className='flex items-end gap-2'>
                        <div className={cn(
                            "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                        )}>
                            <Search size={20} style={{ marginRight: '10px' }} />
                            <input type="text" placeholder="Cari" style={{ border: 'none', outline: 'none', flex: '1' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-md border overflow-auto">
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
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center">
                                    <Loading />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center text-red-500 bg-gray-200">
                                    Error: {error.message || "Gagal mengambil data"}
                                </TableCell>
                            </TableRow>
                        ) : tableData.length ? (
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
                        {/* <TableRow className="relative h-[40px]">
                            {table.getHeaderGroups()[0].headers.map((header, index) => {
                                const column = header.column;
                                let content: React.ReactNode = "";
                                switch (index) {
                                    case 1:
                                        content = "Total Barang:";
                                        break;
                                    case 2:
                                        content = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
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
                        </TableRow> */}
                    </TableFooter>
                </Table>

            </div>
        </div>
    );
};

export default PiutangTable; 