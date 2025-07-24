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
import { cn, fetcher, fetcherPost } from '@/lib/utils';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { id } from 'date-fns/locale';
import { dateForm } from '@/utils/format';
import useSWRMutation from 'swr/mutation';


const KasBankTransTable = () => {
    const [date, setDate] = useState(new Date());
    const [tipeTrans, setTipeTrans] = useState<string | undefined>("TRANSFER");
    const [tipeTF, setTipeTF] = useState<string | undefined>("0");
    const [bankValue, setBankValue] = useState<number | undefined>(undefined);
    const [bankValue2, setBankValue2] = useState<number | undefined>(undefined);

    const [keterangan, setKeterangan] = useState<string>("");
    const [jumlah, setJumlah] = useState<number | undefined>(undefined);
    const [terbilang, setTerbilang] = useState<string>("");


    const { data: bank } = useSWR(`/api/proxy/api/accounts/`, fetcher);
    const { data: me } = useSWR(`/api/proxy/api/users/me/`, fetcher);

    const { trigger: post, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<any, any, string, any>(
        '/api/proxy/api/transactions/',
        fetcherPost
    );

    const onSubmit = async () => {

        const payload = {
            th_date: date,
            th_type: tipeTrans,
            from_account: bankValue,
            to_account: bankValue2,
            th_note: keterangan,
            th_dp: jumlah,
            items: [],
            th_payment_type: "CASH",
            cashier: me.id,
            th_status:true
        };
        console.log(JSON.stringify(payload, null, 1));
        post(payload)
            .then((res) => {
                console.log(res)
                toast.success("Transaksi berhasil");
                setDate(new Date());
                setTipeTrans("TRANSFER");
                setBankValue(undefined);
                setBankValue2(undefined);
                setKeterangan("");
                setJumlah(undefined);
                setTerbilang("");

            })
            .catch((err) => {
                toast.error(err.message);
            });
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <Label htmlFor="date">Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-[240px] h-[30px] justify-start text-left font-normal"
                                    >
                                        <CalendarIcon />
                                        {date ? format(date, "dd-MM-yyyy") : <span>Pilih Tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(val) => setDate(val ?? date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>


                        <div className="flex justify-between">
                            <Label htmlFor="operator">Tipe Transaksi</Label>
                            <Select value={tipeTrans} onValueChange={setTipeTrans}>
                                <SelectTrigger className="w-[240px] h-[30px] justify-between font-normal bg-slate-100">
                                    <SelectValue placeholder="Pilih Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRANSFER">Transfer antar Kas / Bank</SelectItem>
                                    <SelectItem value="EXPENSE">Pengeluaran Kas / Bank</SelectItem>
                                    {/* <SelectItem value="2">Pemasukan Kas / Bank</SelectItem> */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex flex-col gap-4 w-full">
                {/* <div className="flex justify-between  w-full">
                    <Label htmlFor="tipeTransfer">Tipe Transfer</Label>
                    <Select value={tipeTF} onValueChange={setTipeTF}>
                        <SelectTrigger className="w-[240px] h-[30px] justify-between font-normal bg-slate-100">
                            <SelectValue placeholder="Pilih Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Transfer antar Kas / Bank</SelectItem>
                            <SelectItem value="1">Pengeluaran Kas / Bank</SelectItem>
                            <SelectItem value="2">Pemasukan Kas / Bank</SelectItem>
                        </SelectContent>
                    </Select>
                </div> */}
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between">
                        <Label htmlFor="bankAsal">Bank Asal</Label>
                        <Select
                            value={bankValue !== undefined ? String(bankValue) : ""}
                            onValueChange={val => setBankValue(Number(val))}
                        >
                            <SelectTrigger
                                className=
                                "w-[240px] h-[30px] justify-between font-normal bg-slate-100"
                            >
                                <SelectValue placeholder="Pilih Bank Asal" className="text-xs" />
                            </SelectTrigger>
                            <SelectContent>
                                {bank?.map((b: any) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full ">
                    <div className="flex justify-between">
                        <Label htmlFor="bankTujuan">Bank Tujuan</Label>
                        <Select
                            value={bankValue2 !== undefined ? String(bankValue2) : ""}
                            onValueChange={val => setBankValue2(Number(val))}
                        >
                            <SelectTrigger
                                className=
                                "w-[240px] h-[30px] justify-between font-normal bg-slate-100"
                            >
                                <SelectValue placeholder="Pilih Bank Tujuan" className="text-xs" />
                            </SelectTrigger>
                            <SelectContent>
                                {bank?.map((b: any) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-between w-full ">
                    <Label htmlFor="keterangan" className="pt-2">Keterangan</Label>
                    <textarea
                        id="keterangan"
                        value={keterangan}
                        onChange={(e) => setKeterangan(e.target.value)}
                        placeholder="Masukkan keterangan"
                        className=" w-[240px] h-[80px] bg-slate-100 rounded-md border p-2 text-sm"
                    />

                </div>

                <div className="flex justify-between w-full">
                    <Label htmlFor="jumlah">Jumlah</Label>
                    <Input
                        id="jumlah"
                        type="number"
                        placeholder="0"
                        value={jumlah ?? ""}
                        onChange={(e) => setJumlah(Number(e.target.value))}
                        className="w-[240px] h-[30px] bg-slate-100"
                    />

                </div>

                <div className="flex justify-between w-full">
                    <Label htmlFor="terbilang">Terbilang</Label>
                    <Input
                        id="terbilang"
                        value={terbilang}
                        onChange={(e) => setTerbilang(e.target.value)}
                        className="w-[240px] h-[30px] bg-slate-100"
                    />

                </div>

                <div className="flex justify-end gap-2 mt-2 w-full">
                    <Button className='font-medium bg-blue-500 hover:bg-blue-600' onClick={onSubmit}>Simpan</Button>
                </div>
            </div>
        </div>

    )
};

export default KasBankTransTable; 