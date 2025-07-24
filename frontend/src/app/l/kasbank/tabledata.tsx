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
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronDown, ChevronsUpDown, ChevronUp, Clock, Copy, DollarSign, Eye, Printer, Search, Trash, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { distributors, operators, poinMemberPelanggan } from '@/data/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { OperatorDropdown } from '@/components/dropdown-checkbox/operator-dropdown';
import { TipeDropdown } from '@/components/dropdown-checkbox/tipe-dropdown';
import { DateRange } from 'react-day-picker';
import useSWR from 'swr';
import { ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getFacetedRowModel, getFacetedUniqueValues, SortingState, flexRender } from '@tanstack/react-table';
import DetailPiutangModal from '../piutang/hutang-detailHutang-modal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { id } from 'date-fns/locale';


const KasBankTable = () => {
    const [date, setDate] = React.useState<DateRange | undefined>(undefined)
    const [operator, setOperator] = useState<number[]>([]);
    const [tipe, setTipe] = useState<string | undefined>("0");
    const [sorting, setSorting] = useState<SortingState>([
        { id: "payment_date", desc: false },
    ]);
    const [search, setSearch] = useState("");
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [showPrint, setShowPrint] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL!;

    const { data = [], error, isLoading } = useSWR(
        [
            API_URL,
            operator,
            tipe,
            date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
            date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
        ],
        () => {
            let params = "";

            if (operator) params += `&operator=${operator}`;
            if (tipe && tipe !== "0") {
                params += `&payment_method=${tipe}`;
            }
            if (date?.from) params += `&start_date=${format(date.from, "yyyy-MM-dd")}`;
            if (date?.to) params += `&end_date=${format(date.to, "yyyy-MM-dd")}`;

            return fetcher(`/api/proxy/api/payments/?${params}`);
        }
    );



    const columns: ColumnDef<any>[] = [
        {
            header: "Tanggal",
            accessorKey: "payment_date",
            cell: ({ getValue }) => {
                const rawValue = getValue();
                if (!rawValue || typeof rawValue !== 'string') return "-";
                const parsedDate = new Date(rawValue);
                if (isNaN(parsedDate.getTime())) return "-";
                return format(parsedDate, "d/M/yyyy", { locale: id });
            },
        },
        {
            header: "No Faktur",
            accessorKey: "transaction_facture",
            size: 100,
            enableSorting: true,
            filterFn: "includesString",
        },
        { header: "Keterangan", accessorKey: "notes" },
        {
            header: "Masuk",
            cell: ({ row }) =>
                row.original.direction === "Inflow"
                    ? Number(row.original.amount).toLocaleString("id-ID")
                    : "-",
        },
        {
            header: "Keluar",
            cell: ({ row }) =>
                row.original.direction === "Outflow"
                    ? Number(row.original.amount).toLocaleString("id-ID")
                    : "-",
        },

        { header: "Operator", accessorKey: "operator_name" },
        { header: "Metode", accessorKey: "payment_method" },
        {
            header: "Status",
            accessorKey: "status",
            cell: ({ getValue }) => {
                const status = getValue() as string;
                if (status === "COMPLETED") {
                    return (
                        <div className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <Check size={16} /> Complete
                        </div>
                    );
                }
                return (
                    <div className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                        <X size={16} /> Not Complete
                    </div>
                );
            },
        },
        {
            header: "Action",
            cell: ({ row }) => {
                const selectedId = row.original.id;
                return (
                    <Button
                        className="bg-blue-500 hover:bg-blue-600 size-7"
                        onClick={() => {
                            setSelectedRow(row.original);
                            setShowPrint(true);
                        }}
                    >
                        <Printer />
                    </Button>
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
        enableColumnResizing: true, // Ini penting
        columnResizeMode: "onChange", // atau "onEnd"
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
                        <Label htmlFor="operator">Operator</Label>
                        <OperatorDropdown onChange={(id) => setOperator(id)} />
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="tipe">Tipe</Label>
                        <Select value={tipe} onValueChange={setTipe}>
                            <SelectTrigger className="w-[150px] h-[30px] justify-between font-normal bg-slate-100 ">
                                <SelectValue placeholder="Pilih Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Semua</SelectItem>
                                <SelectItem value="CASH">Kas</SelectItem>
                                <SelectItem value="BANK">Bank</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-2" >
                        <Label htmlFor="date">Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[150px] h-[30px] justify-start text-left font-normal",
                                        !date
                                    )}
                                >
                                    <CalendarIcon />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pilih Tanggal</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
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
                            <input type="text" placeholder="Cari Faktur" style={{ border: 'none', outline: 'none', flex: '1' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-md border overflow-auto">
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
                                                {header.isPlaceholder ? null : (
                                                    <div className="flex items-center justify-between w-full h-full">
                                                        <div
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            className="cursor-pointer select-none flex items-center gap-1 pr-2"
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
                                                        {header.column.getCanResize() && (
                                                            <div
                                                                onMouseDown={header.getResizeHandler()}
                                                                onTouchStart={header.getResizeHandler()}
                                                                className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-300"
                                                            style={{ transform: "translateX(50%)" }}
                                                            />
                                                        )}
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
                                            Tidak ada Data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                    {/* <ScrollBar orientation="vertical" className='z-40' /> */}
                </ScrollArea>
            </div>
            {showPrint && selectedRow && (
                <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div
                        className="bg-white p-6 rounded w-[350px] print:w-full print:rounded-none print:bg-white"
                        id="print-area"
                    >
                        <h2 className="font-bold text-lg mb-2">Faktur #{selectedRow.id}</h2>
                        <p>Tanggal: {selectedRow.payment_date}</p>
                        <p>Keterangan: {selectedRow.notes}</p>
                        <p>Masuk: {selectedRow.masuk}</p>
                        <p>Keluar: {selectedRow.keluar}</p>
                        <p>Total: {selectedRow.amount}</p>
                        <p>Tipe: {selectedRow.payment_type}</p>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={() => window.print()}>Print/Save as PDF</Button>
                            <Button variant="outline" onClick={() => setShowPrint(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>


    );
};

export default KasBankTable; 