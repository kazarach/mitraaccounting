"use client";
import React, { useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { cn, fetcher, fetcherPost } from "@/lib/utils";
import { format } from "date-fns";
import { Description } from "@radix-ui/react-dialog";
import useSWR from "swr";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSWRMutation from "swr/mutation";
import { toast } from "sonner";

interface BayarTPModalProps {
  review: any;
  supplier_name: string;
  onClose?: () => void;
  // props onClose, onOpenNext dihapus jika tidak dipakai
}

const BayarTPModal: React.FC<BayarTPModalProps> = ({
  review,
  supplier_name,
  onClose,
}) => {
  const totalBayar = review?.th_total || 0;
  const dp = review?.th_dp || 0;
  const kurangBayar = Math.max(totalBayar - (review?.th_round || 0) - dp, 0);

  const [paymentType, setPaymentType] = useState<string>("CASH");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [bankValue, setBankValue] = useState<number | undefined>(undefined);
  const [subsidi, setSubsidi] = useState<number>(0);
  const [inputDP, setInputDP] = useState<number>(dp);


  const paymentFlags = {
    isCredit: paymentType === "CREDIT",
    isBank: paymentType === "BANK" || paymentType === "CREDIT",
    isCash: paymentType === "CASH",
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data: bank } = useSWR(`/api/proxy/api/banks/`, fetcher);

  const { trigger, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
    any,
    any,
    string,
    any
  >(
    `/api/proxy/api/transactions/`,
    fetcherPost
  );
  const { data : me, error, isLoading, mutate } = useSWR(`/api/proxy/api/users/me/`, fetcher);

  const onSubmit = async () => {
    console.log(review)
    const payload = {
      th_type: 9,
      cashier: me.id,
      th_date: review.date.toISOString() || "",
      th_note: "",
      th_ppn: review.isPpnIncluded ? 0 : 11,
      th_payment_type: "CASH",
      items: review.items.map((item:any) => ({
        stock: item.stock_id,
        stock_code: item.stock_code || "",
        stock_name: item.stock_name,
        stock_price_buy: item.stock_price_buy,
        quantity: review.returnQTYMap[item.stock_id] ?? 0,
        disc: item.disc || 0,
        disc_percent: item.disc_percent || 0,
        disc_percent2: item.disc_percent2 || 0,
      }))
    };

    // console.log(payload)
     
    trigger(payload)
      .then((res) => {
        console.log(res);
        toast.success("Transaksi return berhasil");
        if (onClose) onClose();
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  return (
    <div className="flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
          Pembayaran
        </DialogTitle>
        <Description />
      </DialogHeader>
      <div className="border rounded-md overflow-auto mb-2">
        <Table>
          <TableHeader>
            <TableRow />
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Supplier</TableCell>
              <TableCell className="text-right border-l">{supplier_name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell className="text-right border-l">
                {review?.subtotal?.toLocaleString("id-ID") || "0"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(-) Diskon</TableCell>
              <TableCell className="text-right border-l">
                {review?.th_disc?.toLocaleString("id-ID") || "0"}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>(+) PPN</TableCell>
              <TableCell className="text-right border-l">
                {review?.th_ppn?.toLocaleString("id-ID") || "0"}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Total Net</TableCell>
              <TableCell className="text-right border-l font-semibold">
                {(totalBayar - (review?.th_round || 0)).toLocaleString("id-ID")}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tipe Bayar</TableCell>
              <TableCell className="text-left border-l p-0">
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="relative w-full bg-white text-sm border-0 rounded-none">
                    <SelectValue placeholder="Tipe Bayar" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK">Transfer Bank</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT">Kartu Kredit</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select
                  disabled={!paymentFlags.isBank}
                  value={bankValue !== undefined ? String(bankValue) : ""}
                  onValueChange={val => setBankValue(Number(val))}
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
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>No. Kartu</TableCell>
              <TableCell className="text-right border-l">-</TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell>Surcharge</TableCell>
              <TableCell className="text-right border-l">0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Subsidi</TableCell>
              <TableCell className="text-right border-l p-0">
                <Input
                  type="number"
                  value={subsidi}
                  onChange={e => setSubsidi(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="bg-gray-100 text-right border-0 m-0 p-0 rounded-none"
                />
              </TableCell>
            </TableRow> */}

            <TableRow>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Sisa Bayar</TableCell>
              <TableCell className="text-right border-l font-semibold">
                {(totalBayar - (review?.th_round || 0) - inputDP).toLocaleString("id-ID")}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pembayaran</TableCell>
              <TableCell className="text-right border-l p-0">
                <Input
                  type="number"
                  value={inputDP}
                  onChange={e => setInputDP(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="rounded-none border-0"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Kurang Bayar</TableCell>
              <TableCell className="text-right border-l">
                {Math.max(totalBayar - (review?.th_round || 0) - inputDP, 0).toLocaleString("id-ID")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mb-0 pb-0">
        <Button className="bg-blue-500 hover:bg-blue-600" type="button"
        onClick={onSubmit}>
          Bayar
        </Button>
      </div>
    </div>
  );
};

export default BayarTPModal;
