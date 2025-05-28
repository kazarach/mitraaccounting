"use client";
import React from 'react';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn, fetcher, fetcherPost } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import { Description, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { toast } from 'sonner';


interface BayarTPModalProps {
    review: any;
    form: UseFormReturn<{
        th_date: string;
        supplier: number;
        th_disc?: number;
        th_payment_type?: string;
        th_dp?: number;
        bank?: number;
    }>;
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    supplier_name: string;
    onClose: () => void;
    onOpenNext: () => void;
}

const BayarTPModal: React.FC<any> = ({ review, form, date, setDate, supplier_name, onClose, onOpenNext, onSubmit }) => {
    const bayar = form.watch("th_dp") || 0;
    const totalBayar = review?.th_total || 0;
    const dp = review?.th_dp || 0;
    const kurangBayar = Math.max((totalBayar - dp) - bayar, 0);

    const paymentType = form.watch("th_payment_type");
    const paymentFlags = {
        isCredit: paymentType === "CREDIT",
        isBank: paymentType === "BANK" || paymentType === "CREDIT",
        isCash: paymentType === "CASH",
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL!;
    const { data: bank } = useSWR(`${API_URL}api/banks/`, fetcher);

    const { trigger: checkPriceTrigger, data: priceData, error: priceCheckError } = useSWRMutation<any, any, string, any>(
        "http://100.82.207.117:8000/api/stock/by_ids/",
        fetcherPost
    );

    const checkPrice = async () => {
        const payload: any = {
            item_ids: review.items.map((item: any) => item.stock_id),
        }
        console.log(JSON.stringify(payload, null, 1));
        checkPriceTrigger(payload)
            .then((res) => {
                console.log(res)
            })
            .catch((err) => {
                toast.error(err.message);
            });
    };



    return (

        <form onSubmit={onSubmit} className="space-y-8">
            <div className="flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold text-gray-800 mb-2">Pembayaran</DialogTitle>
                    <Description />
                </DialogHeader>

                <div className="border rounded-md overflow-auto mb-2">
                    <Table>
                        <TableHeader><TableRow /></TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Supplier</TableCell>
                                <TableCell className="text-right border-l">{supplier_name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Subtotal</TableCell>
                                <TableCell className="text-right border-l">{review?.subtotal?.toLocaleString("id-ID") || "0"}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>(-) Diskon</TableCell>
                                <TableCell className="text-right border-l">{review?.th_disc?.toLocaleString("id-ID") || "0"}%</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>(+) PPN</TableCell>
                                <TableCell className="text-right border-l">{review?.th_ppn?.toLocaleString("id-ID") || "0"}%</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold ">Total Net</TableCell>
                                <TableCell className="text-right border-l font-semibold ">{((review?.th_total || 0) - (review?.th_round || 0)).toLocaleString("id-ID")}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Tipe Bayar</TableCell>
                                <TableCell className="text-left border-l p-0">
                                    <FormField
                                        control={form.control}
                                        name="th_payment_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger className="relative w-full bg-white text-sm border-0 rounded-none">
                                                            <SelectValue placeholder="Tipe Bayar" className="text-xs" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="BANK">Transfer Bank</SelectItem>
                                                            <SelectItem value="CASH">Tunai</SelectItem>
                                                            <SelectItem value="CREDIT">Kartu Kredit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>Jatuh Tempo</TableCell>
                                <TableCell className="text-right border-l p-0">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled={!paymentFlags.isCredit}
                                                className={cn(
                                                    "w-full justify-start text-right font-normal text-sm border-0 rounded-none bg-white",
                                                    !paymentFlags.isCredit && "bg-gray-300 cursor-not-allowed"
                                                )}
                                            >
                                                <CalendarIcon />
                                                {date ? format(date, "PPP") : <span>Pilih Tanggal</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>Bank</TableCell>
                                <TableCell className="text-left border-l p-0">
                                    <FormField
                                        control={form.control}
                                        name="bank"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Select
                                                        disabled={!paymentFlags.isBank}
                                                        value={field.value !== undefined ? String(field.value) : ""}
                                                        onValueChange={(val) => field.onChange(Number(val))}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                "relative w-full border-0 bg-white text-sm rounded-none",
                                                                !paymentFlags.isBank && "bg-gray-300 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Pilih Bank" className="text-xs" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {bank?.map((b: any) => (
                                                                <SelectItem key={b.id} value={String(b.id)}>
                                                                    {b.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>No. Kartu</TableCell>
                                <TableCell className="text-right border-l">-</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Surcharge</TableCell>
                                <TableCell className="text-right border-l">0</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Subsidi</TableCell>
                                <TableCell className="text-right border-l p-0">
                                    <Input type="number" placeholder="0" className="bg-gray-100 text-right border-0 m-0 p-0 rounded-none" />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>DP</TableCell>
                                <TableCell className="text-right border-l ">
                                    {review?.th_dp?.toLocaleString("id-ID") || "0"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-semibold">Sisa Bayar</TableCell>
                                <TableCell className="text-right border-l font-semibold">
                                    {(((review?.th_total || 0) - (review?.th_round || 0)) - (review?.th_dp || 0)).toLocaleString("id-ID")}
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>Pembayaran</TableCell>
                                <TableCell className="text-right border-l p-0">
                                    <FormField
                                        control={form.control}
                                        name="th_dp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                                        type="number"
                                                        placeholder="0"
                                                        className="rounded-none border-0"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell>Kurang Bayar</TableCell>
                                <TableCell className="text-right border-l">
                                    {kurangBayar.toLocaleString("id-ID")}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end mb-0 pb-0">



                    <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        type="button"
                        onClick={form.handleSubmit((values:any) => {
                            onSubmit(values);
                            onClose();
                            onOpenNext();
                        })}
                    >
                        Bayar
                    </Button>

                </div>
            </div>
        </form>

    );
};

export default BayarTPModal;
