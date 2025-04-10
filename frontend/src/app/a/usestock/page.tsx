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
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Copy, Eye, Pencil, Printer, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TpModal from '@/components/modal/tp-pesanan-modal';
import TambahProdukModal from '@/components/modal/tambahProduk-modal';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { distributors, usestockdata } from '@/data/product';
import DetailUseStock from '@/components/modal/detailusestock-modal';
import { DateRange } from 'react-day-picker';

const StockUse = () => {
    const tableName = "stockuse";
    const [selectedDistributor, setSelectedDistributor] = useState("All");
    const [date, setDate] = React.useState<DateRange | undefined>(undefined)
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const [search, setSearch] = useState("");
    const dispatch = useDispatch();


    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    return (
        <div className="flex justify-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Arsip Pemakaian Persediaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col space-y-2" >
                                                                    <Label htmlFor="date">Tanggal</Label>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button
                                                                                id="date"
                                                                                variant={"outline"}
                                                                                className={cn(
                                                                                    "w-56 justify-start text-left font-normal",
                                                                                    !date && "text-muted-foreground"
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
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="distributor">Operator</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-[200px] justify-between font-normal"
                                            >
                                                {value
                                                    ? distributors.find((d) => d.value === value)?.label
                                                    : "Pilih Operator"}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search Distributor" />
                                                <CommandList>
                                                    <CommandEmpty>No Distributor found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {distributors.map((d) => (
                                                            <CommandItem
                                                                key={d.value}
                                                                value={d.label}
                                                                data-value={d.value}
                                                                onSelect={(currentLabel: string) => {
                                                                    const selectedDistributor = distributors.find((dist) => dist.label === currentLabel);
                                                                    if (selectedDistributor) {
                                                                        setValue(selectedDistributor.value);
                                                                    } else {
                                                                        setValue("");
                                                                    }
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                {d.label}
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto",
                                                                        value === d.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No Faktur</TableHead>
                                        <TableHead>Operator</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Barang</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usestockdata.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-gray-400 bg-gray-200">
                                                Belum menambahkan produk
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        usestockdata.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.noFaktur ?? "-"}</TableCell>
                                                <TableCell className="font-medium">{item.operator ?? "-"}</TableCell>
                                                <TableCell>{item.tanggal}</TableCell>
                                                <TableCell>
                                                    {item.items.length > 3 ? (
                                                        <>
                                                            <div>{item.items[0].produk}</div>
                                                            <div>{item.items[1].produk}</div>
                                                            <div>...</div>
                                                        </>
                                                    ) : (
                                                        item.items.map((product, index) => (
                                                            <div key={index}>{product.produk}</div>
                                                        ))
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button className="bg-blue-500 hover:bg-blue-600 size-7 mr-1">
                                                                <Eye />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[80vw] max-h-[90vh]">
                                                            <DetailUseStock noFaktur={item.noFaktur} />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Button className='bg-yellow-500 hover:bg-yellow-600 size-7 mr-1'>
                                                        <Pencil />
                                                    </Button>
                                                    <Button className='bg-blue-500 hover:bg-blue-600 size-7 mr-1'>
                                                        <Printer />
                                                    </Button>
                                                    <Button className='bg-red-500 hover:bg-red-600 size-7 mr-1' >
                                                        <Trash />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className='flex justify-end gap-2 mt-4 '>

                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StockUse; 