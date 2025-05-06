"use client";
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HutangData } from '@/data/product';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';


    const BayarTPModalJual: React.FC<{ data: any }> = ({ data }) => {
        const [date, setDate] = React.useState<Date>()
    return (
        <div className=" flex flex-col " >
            <DialogHeader>
                <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
                    Pembayaran
                </DialogTitle>
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
                        <TableRow className='font-semibold'>
                            <TableCell className='border-r'>Customer Name</TableCell>
                            <TableCell>{data?.customer_name ?? "-"}</TableCell>
                        </TableRow>
                    </TableHeader>


                    <TableBody>
                        <TableRow >
                            <TableCell className='border-r' >Subtotal</TableCell>
                            <TableCell>
                Rp {(data?.subtotal ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
              </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>DP</TableCell>
                            <TableCell className="text-left border-l">{`5000`}</TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>(-) Diskon</TableCell>
                            <TableCell className='bg-gray-100'>
                                {(data?.th_disc ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2 })} %
                            </TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell>(+) PPN Exclude</TableCell>
                            <TableCell className="text-right border-l p-0 ">
                                <Input type='number' placeholder='0%' className='bg-gray-100 text-right border-0 m-0 p-0 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Total</TableCell>
                            <TableCell className="text-left border-l">{`5000`}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Pembulatan</TableCell>
                            <TableCell className="text-left border-l">{`5000`}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className='font-bold'>Total Net</TableCell>
                            <TableCell className="text-left border-l font-bold">{`5000`}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Tipe Bayar</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                                <Select>
                                    <SelectTrigger className="relative w-full bg-white text-xs border-0 rounded-none">
                                        <SelectValue placeholder="No Faktur" className='text-xs' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='a'>Kas</SelectItem>
                                        <SelectItem value='a'>Kas</SelectItem>
                                        <SelectItem value='a'>Kas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jatuh tempo</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-0 rounded-none  bg-white",
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
                            <TableCell className=''>Bank</TableCell>
                            <TableCell className="text-left border-l p-0">
                                <Select>
                                    <SelectTrigger className="relative w-full border-0 bg-white text-xs rounded-none">
                                        <SelectValue placeholder="Bank" className='text-xs' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='a'>Kas</SelectItem>
                                        <SelectItem value='a'>Kas</SelectItem>
                                        <SelectItem value='a'>Kas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>No. Kartu</TableCell>
                            <TableCell className="text-left border-l "> - </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Surcharge</TableCell>
                            <TableCell className="text-left border-l "> 0 </TableCell>
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
                            <TableCell className='font-bold'>Harus Dibayar</TableCell>
                            <TableCell className="text-left border-l font-bold">{`5000`}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Pembayaran</TableCell>
                            <TableCell className="text-right border-l p-0 ">
                                <Input type='number' placeholder='0' className='bg-gray-100 text-right border-0 m-0 p-0 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Kurang bayar</TableCell>
                            <TableCell className="text-left border-l ">{`5000`}</TableCell>
                        </TableRow>
                    </TableBody>

                </Table>
            </div>
            <div className="flex justify-end mb-0 pb-0">
                <Button className="bg-blue-500 hover:bg-blue-600">Bayar</Button>

            </div>
        </div>

    );
};

export default BayarTPModalJual;
