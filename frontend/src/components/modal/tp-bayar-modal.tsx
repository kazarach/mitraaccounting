"use client";
import React, { useEffect } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HutangData } from '@/data/product';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import { any, z } from 'zod';
import { Description } from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import DistributorDD from '../dropdown-normal/distributor_dd';
import { toast } from 'sonner';
import useSWR from 'swr';

interface BayarTPModalProps {
    review: any;

}



const formSchema = z.object({
    th_payment_type: z.string({
        required_error: "Pilih Tipe Bayar"
    }),
    th_dp: z.number({
        required_error: "Masukkan Pembayaran"
    })

})

const BayarTPModal: React.FC<BayarTPModalProps> = ({ review }) => {
    const [date, setDate] = React.useState<Date>()


    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_payment_type: "",
            th_dp: undefined,
            bank_name: "",
        },
    })

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



    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const { data: bank, error, isLoading, mutate } = useSWR(`${API_URL}api/banks/`, fetcher);

    const onSubmit2 = (values: z.infer<typeof formSchema>) => {
        console.log(values);

    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-8">
                <div className=" flex flex-col " >
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
                            Pembayaran
                        </DialogTitle>
                        <Description></Description>
                    </DialogHeader>

                    <div className="flex  gap-4 mb-3 ">
                        <div className="flex flex-col gap-2 justify-between w-full">
                            <div className="flex justify-between" >

                            </div>


                        </div>
                    </div>
                    <div className='border rounded-md overflow-auto mb-2 '>
                        <Table  >
                            <TableHeader>
                                <TableRow>

                                </TableRow>
                            </TableHeader>


                            <TableBody>
                                <TableRow>
                                    <TableCell>Supplier</TableCell>
                                    {/* <TableCell className="text-left border-l">{review.supplier}</TableCell> */}
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
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right border-l ">{((review?.th_total || 0) - (review?.th_round || 0)).toLocaleString("id-ID")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Pembulatan</TableCell>
                                    <TableCell className="text-right border-l ">{review?.th_round?.toLocaleString("id-ID") || "0"}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-bold">Total Net</TableCell>
                                    <TableCell className="text-right border-l font-bold">{review?.th_total?.toLocaleString("id-ID") || "0"}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''></TableCell>

                                </TableRow>
                                <TableRow>
                                    <TableCell className=''>Tipe Bayar</TableCell>
                                    <TableCell className="text-left border-l p-0">
                                        <FormField
                                            control={form.control}
                                            name="th_payment_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select {...field} onValueChange={field.onChange} value={field.value}>
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
                                    <TableCell className=''>Jatuh tempo</TableCell>
                                    <TableCell className="text-right border-l  p-0 ">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    disabled={!paymentFlags.isCredit}
                                                    className={cn(
                                                        "w-full justify-start text-right font-normal  text-sm border-0 rounded-none bg-white",
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
                                            name="bank_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select
                                                            disabled={!paymentFlags.isBank}
                                                            value={field.value}
                                                            onValueChange={field.onChange}
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
                                    <TableCell className=''>No. Kartu</TableCell>
                                    <TableCell className="text-right border-l "> - </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''>Surcharge</TableCell>
                                    <TableCell className="text-right border-l "> 0 </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''>Subsidi</TableCell>
                                    <TableCell className="text-right border-l p-0 ">
                                        <Input type='number' placeholder='0' className='bg-gray-100 text-right border-0 m-0 p-0 rounded-none ' />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>DP</TableCell>
                                    <TableCell className="text-right border-l p-0 ">
                                        {review?.th_dp?.toLocaleString("id-ID") || "0"}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className='font-bold'>Sisa Bayar</TableCell>
                                    <TableCell className="text-right border-l font-bold">{((review?.th_total || 0) - (review?.th_dp || 0)).toLocaleString("id-ID")}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''>Pembayaran</TableCell>
                                    <TableCell className="text-right border-l p-0 ">
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
                                                            className="..."
                                                        />

                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className=''>Kurang bayar</TableCell>
                                    <TableCell className="text-right border-l ">
                                        {kurangBayar.toLocaleString("id-ID")}
                                    </TableCell>
                                </TableRow>

                            </TableBody>

                        </Table>
                    </div>
                    <div className="flex justify-end mb-0 pb-0">
                        <Button className="bg-blue-500 hover:bg-blue-600" type='submit' >Bayar</Button>

                    </div>
                </div >
            </form>
        </Form >

    );
};

export default BayarTPModal;
