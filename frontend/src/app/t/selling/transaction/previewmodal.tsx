"use client";
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import BankDDTS from './bank-dd';
import { toast } from 'sonner';
import useSWR from 'swr';


interface BayarTPModalJualProps {
    data: any;
    onSuccess?: () => void;
}

const BayarTPModalJual: React.FC<BayarTPModalJualProps> = ({ data, onSuccess }) => {
    const [date, setDate] = React.useState<Date>()
    const [dp, setDp] = React.useState<number>(0); // ⬅️ state untuk input DP
    React.useEffect(() => {
        if (data?.th_dp) {
            setDp(parseFloat(data.th_dp)); // pastikan dalam bentuk number
        }
    }, [data]);
    const [payment, setPayment] = React.useState<number>(0);
    const [selectedBank, setSelectedBank] = React.useState<number | null>(null);
    const [payType, setPayType] = React.useState<string | null>('CASH');
    const [open, setOpen] = React.useState(false);
    const [bankCode, setBankCode] = React.useState<string>("");
    const [showValidation, setShowValidation] = React.useState(false);

    const handlePostTransaction = async () => {
        setShowValidation(true);
        const rawPayload = data?._rawPayload;
        const transactionId = data?.transactionId ?? data?._rawPayload?.id;
        const isFromOrderModal = data?.fromOrderModal;
        if (payType === "BANK" && !selectedBank) {
            toast.error("Silakan pilih bank terlebih dahulu.");
            return;
        }

        if (payType === "CREDIT" && !date) {
            toast.error("Silakan pilih tanggal jatuh tempo terlebih dahulu.");
            return;
        }

        if (!rawPayload) {
            toast.error("Payload transaksi tidak tersedia.");
            return;
        }
        if (!payment || payment <= 0) {
            toast.error("Silakan isi jumlah pembayaran terlebih dahulu.");
            return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL!;
        const { data: me, error, isLoading, mutate } = useSWR(`${API_URL}api/users/me/`, fetcher);
        const th_dp_total = (dp || 0) + (payment || 0);
        const accessToken = localStorage.getItem("access") ?? "";
        const refreshToken = localStorage.getItem("refresh") ?? "";
        try {
            // STEP 1: PATCH jika dari order modal
            if (isFromOrderModal && transactionId) {
                const patchPayload = { th_order: false };
                console.log("🛠 PATCH Payload:", JSON.stringify(patchPayload, null, 2));

                const patchResponse = await fetch(`${API_URL}api/transactions/${transactionId}/`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                        "x-refresh-token": refreshToken,
                    },

                    body: JSON.stringify(patchPayload),
                });

                if (!patchResponse.ok) {
                    const patchError = await patchResponse.text();
                    throw new Error(`PATCH gagal: ${patchError}`);
                }

                console.log("✅ PATCH sukses", JSON.stringify(patchPayload, null, 2));
            }

            // STEP 2: POST transaksi baru
            const postPayload = {
                ...rawPayload,
                cashier: me.id,
                th_type: "SALE",
                th_order: false,
                th_dp: th_dp_total,
                bank: selectedBank || null,
                th_due_date: date?.toISOString() || null,
                th_status: true,
                th_order_reference: transactionId ?? null,
            };

            console.log("🆕 POST Payload:", JSON.stringify(postPayload, null, 2));

            const postResponse = await fetch(`${API_URL}api/transactions/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "x-refresh-token": refreshToken,
                },

                body: JSON.stringify(postPayload),
            });

            if (!postResponse.ok) {
                const postError = await postResponse.text();
                throw new Error(`POST gagal: ${postError}`);
            }

            const result = await postResponse.json();
            console.log("✅ POST sukses:", result);
            toast.success("Transaksi berhasil disimpan!");

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("❌ Gagal menyimpan transaksi:", err);
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
                                {(Number(data?.th_total ?? 0)).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
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
                                <div className={cn(
                                    payType !== "BANK" ? "pointer-events-none opacity-50" : "",
                                    showValidation && payType === "BANK" && !selectedBank ? "border border-red-500 rounded" : ""
                                )}>
                                    <BankDDTS
                                        value={selectedBank}
                                        onChange={(bank) => {
                                            setSelectedBank(bank?.id ?? null);
                                            setBankCode(bank?.code ?? "");
                                        }}
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jatuh tempo</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                                <div className={cn(
                                    payType !== "CREDIT" ? "pointer-events-none opacity-50" : "",
                                    showValidation && payType === "CREDIT" && !date ? "border border-red-500 rounded" : ""
                                )}>
                                    <Popover open={open} onOpenChange={setOpen}>
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
                                                    if (payType === "CREDIT") setDate(date);
                                                }}
                                                initialFocus
                                            />
                                            <div className='flex justify-between'>

                                                <Button className="m-2 h-[30px] bg-red-500 hover:bg-red-600" onClick={() => (setOpen(false), setDate(undefined))}>Hapus</Button>
                                                <Button className="m-2 h-[30px]" onClick={() => setOpen(false)}>Pilih</Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>No. Kartu</TableCell>
                            <TableCell className="text-left border-l p-0">
                                <div className="border-0 m-0 p-2 rounded-none text-sm">
                                    {bankCode || "-"}
                                </div>
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
                                    type="text"
                                    inputMode="numeric"
                                    value={payment === 0 ? "" : payment.toLocaleString("id-ID")}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                                        const numeric = parseInt(raw || "0", 10);
                                        setPayment(numeric);
                                    }}
                                    placeholder='0'
                                    className={cn(
                                        "bg-gray-100 text-left border-0 m-0 p-2 rounded-none",
                                        showValidation && (!payment || payment <= 0) ? "border border-red-500" : ""
                                    )}
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

export default BayarTPModalJual;
