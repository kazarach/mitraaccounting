"use client";
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import BankDDTS from './bank-dd';
import { toast } from 'sonner';


interface BayarTPModalJualProps {
  data: any;
  onSuccess?: () => void;
}

        const BayarTPModalOrderJual: React.FC<BayarTPModalJualProps> = ({ data, onSuccess }) => {
        const [date, setDate] = React.useState<Date>()
        const [dp, setDp] = React.useState<number>(0); // ⬅️ state untuk input DP
        const [payment, setPayment] = React.useState<number>(0);
        const [selectedBank, setSelectedBank] = React.useState<number | null>(null);
        const [payType, setPayType] = React.useState<string | null>(null);

        const handlePostTransaction = async () => {
            const rawPayload = data?._rawPayload;
          
            if (!rawPayload) {
              toast.error("Payload transaksi tidak tersedia.");
              return;
            }
          
            const payload = {
              ...rawPayload,
              th_dp: (dp || 0) + (payment || 0),
              bank: selectedBank || null,
              th_due_date: date?.toISOString() || null,
              th_type: "ORDERIN",
              cashier: rawPayload.cashier ?? null,
            };
            console.log("Payload modal:", JSON.stringify(payload, null, 2));
          
            try {
              const API_URL = process.env.NEXT_PUBLIC_API_URL!;
              const response = await fetch(`${API_URL}api/transactions/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
          
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
              }
          
              const result = await response.json();
              console.log("✅ Transaksi berhasil:", result);
              toast.success("Data dari modal berhasil dikirim ke server!");
              if (onSuccess) onSuccess();
            } catch (err) {
              console.error("❌ Gagal kirim:", err);
              toast.error("Gagal menyimpan transaksi.");
            }
          };                    
          

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
                            <TableCell className='text-right'>
                                {(data?.subtotal ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>(-) Diskon Nota</TableCell>
                            <TableCell className='text-right'>
                            {data?.th_disc?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) || "0"}%
                            </TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>(+) PPN Include</TableCell>
                            <TableCell className='text-right'>
                            {data?.th_ppn?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) || "0"}%
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right border-l">
                            {((data?.th_total ?? 0) - (data?.th_round ?? 0)).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Pembulatan</TableCell>
                            <TableCell className="text-right border-l">
                            {(data?.th_round ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className='font-bold'>Total Net</TableCell>
                            <TableCell className="text-right border-l font-bold">
                            {(Number(data?.th_total ?? 0) - dp).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Tipe Bayar</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                            <Select onValueChange={(value) => setPayType(value)} value={payType ?? undefined}>
                                <SelectTrigger className="relative w-full bg-white text-sm border-0 rounded-none">
                                    <SelectValue placeholder="Pilih Tipe Bayar" className='text-sm' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CREDIT">Credit Card</SelectItem>
                                    <SelectItem value="BANK">Transfer Bank</SelectItem>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Bank</TableCell>
                            <TableCell className="text-left border-l p-0">
                            <div className={payType !== "BANK" ? "pointer-events-none opacity-50" : ""}>
                                <BankDDTS
                                    value={selectedBank}
                                    onChange={(bank) => setSelectedBank(bank?.id ?? null)}
                                />
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jatuh tempo</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                                <div className={payType === "BANK" ? "pointer-events-none opacity-50" : ""}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-0 rounded-none  bg-white",
                                            )}
                                        >
                                            <CalendarIcon />
                                            {date ? format(date, "dd/MM/yyyy") : <span>Pilih Tanggal</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(date) => {
                                            if (payType !== "BANK") setDate(date);
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>No. Kartu</TableCell>
                            <TableCell className="text-left border-l p-0">
                                <Input type='number' placeholder='0' className='bg-gray-100 border-0 m-0 p-2 rounded-none '/>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Subsidi</TableCell>
                            <TableCell className="text-left border-l p-0 ">
                                <Input type='number' placeholder='0' className='bg-gray-100 border-0 m-0 p-2 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>DP</TableCell>
                            <TableCell className="text-right border-l ">{data?.th_dp?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) || "0"}</TableCell>
                            </TableRow>
                        <TableRow>
                            <TableCell className='font-bold'>Harus Dibayar</TableCell>
                            <TableCell className="text-right border-l font-bold">
                            {(Number(data?.th_total ?? 0) - dp).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Pembayaran</TableCell>
                            <TableCell className="text-left border-l p-0 ">
                                <Input
                                type="number"
                                value={payment === 0 ? "" : payment}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/^0+(?!$)/, "");
                                    setPayment(parseFloat(raw) || 0);
                                }}
                                placeholder='0'
                                className='bg-gray-100 text-left border-0 m-0 p-2 rounded-none'
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Kurang bayar</TableCell>
                            <TableCell className="text-right border-l ">
                                {(Math.max(0, (Number(data?.th_total ?? 0) - dp - payment))).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    </TableBody>

                </Table>
            </div>
            <div className="flex justify-end mb-0 pb-0">
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={handlePostTransaction}>Bayar</Button>

            </div>
        </div>

    );
};

export default BayarTPModalOrderJual;