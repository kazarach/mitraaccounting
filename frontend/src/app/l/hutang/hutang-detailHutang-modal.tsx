"use client";
import React, { useEffect, useState } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../../../components/ui/table';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { cn, fetcher, fetcherPost } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/button';
import { Calendar } from '../../../components/ui/calendar';
import { Input } from '../../../components/ui/input';
import useSWR, { mutate } from 'swr';
import { dateForm } from '@/utils/format';
import useSWRMutation from 'swr/mutation';
import { toast } from 'sonner';

interface DetailHutangProps {
  id: number;
  onClose?: () => void;
}

const DetailHutangModal: React.FC<DetailHutangProps> = ({ id, onClose }) => {
  const [selectedFaktur, setSelectedFaktur] = useState<string | undefined>();
  const [date, setDate] = useState(new Date());
  const [paymentType, setPaymentType] = useState("CASH");
  const [diskon, setDiskon] = useState<string | number>('');
  const [pembayaran, setPembayaran] = useState<string | number>('');
  const [bankValue, setBankValue] = useState<number | undefined>();
  const [note, setNote] = useState<string>('');


  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data, error, isLoading } = useSWR(
    `/api/proxy/api/araps/${id}/?unsettled_transactions_only=true`,
    fetcher
  );
  const { data: bank, error: err, isLoading: lod } = useSWR(
    `/api/proxy/api/banks/`,
    fetcher
  );
  const { trigger, error: ror } = useSWRMutation(
    'arap-payment', // key hanya untuk identifikasi, tidak penting
    async (_key, { arg }: { arg: { id: number; data: any } }) => {
      return fetcherPost(`/api/proxy/api/araps/${arg.id}/add_payment/`, { arg: arg.data });
    }
  );


  useEffect(() => {
    if (data?.transactions?.length > 0) {
      setSelectedFaktur(String(data.transactions[0].id));
    }
  }, [data]);

  if (error || err || ror) return <div>Error memuat data</div>;
  if (isLoading || lod || !data || !data.transactions) return <div>Loading...</div>;

  const selectedTransaction = data.transactions.find(
    (item: any) => String(item.id) === selectedFaktur
  );
  const selectedBank = bank?.find((b: any) => b.id === bankValue);

  const jumlahHutang = selectedTransaction
    ? Number(selectedTransaction.remaining_amount)
    : 0;
  const totalHutang = jumlahHutang - ((Number(diskon) / 100) * jumlahHutang);
  const sisaHutang = totalHutang - Number(pembayaran);

  const formatAmount = (amount: string | number) =>
    Number(amount).toLocaleString("id-ID");

  const onSubmit = async () => {
    if (!selectedTransaction) return;
    id = data?.id
    const payload = {
      amount: pembayaran,
      payment_method: paymentType,
      payment_bank: selectedBank?.id || null,
      notes: note,
      allocation_strategy: "FIFO",
      arap_transaction_id: selectedTransaction.id,
      payment_date: date, //blm ada
    };
    console.log(payload)
    trigger({
      id,
      data: payload
    })
      .then((res) => {
        console.log(res)
        toast.success("Pembayaran Hutang Berhasil");
        mutate(`/api/proxy/api/araps/${id}/?unsettled_transactions_only=true`);
        onClose?.();
        setNote('');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };


  return (
    <div className="flex flex-col">
      <div className="flex gap-4 mb-0">
        <div className="flex flex-col gap-2 justify-between w-full">
          <div className="flex justify-between">
            <Label htmlFor="Pemasok" className="text-xs min-w-1/3">
              Supplier
            </Label>
            <div className="relative w-[200px] bg-gray-100 py-2 rounded-sm text-xs">
              <p className="ml-2">{data.supplier_name}</p>
            </div>
          </div>

          {data.transactions.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-10 border rounded-md bg-gray-100">
              Tidak ada Hutang.
            </div>
          ) : (
            <>
              <div className="flex  justify-between">
                <Label htmlFor="faktur" className='text-xs '>No. Faktur</Label>
                <Select value={selectedFaktur} onValueChange={setSelectedFaktur}>
                  <SelectTrigger className="relative w-[200px] text-xs">
                    <div className="flex justify-between w-full">
                      <span>
                        {selectedTransaction
                          ? `Rp ${formatAmount(selectedTransaction.amount)}`
                          : '-'}
                      </span>
                      <span>
                        {selectedTransaction
                          ? dateForm(selectedTransaction.due_date)
                          : '-'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.transactions ?? []).map((item: any) => (
                      <SelectItem key={item.id} value={String(item.id)} className="text-xs !p-0">
                        <div className="flex justify-between w-full px-2 py-2">
                          <p className='mr-10'>Rp {formatAmount(item.amount)}  </p>
                          <p>  {item ? dateForm(item.due_date) : '-'}</p>

                        </div>
                      </SelectItem>

                    ))}
                  </SelectContent>

                </Select>

              </div>

              <div className="flex justify-between" >
                <Label htmlFor="date" className='text-xs '>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className='w-[200px] text-black border hover:bg-white justify-start text-left font-normal text-xs bg-white '
                    >
                      <CalendarIcon />
                      {date ? format(date, "dd-MM-yyyy") : <span>Pilih Tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={val => setDate(val ?? date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex  justify-between">
                <Label htmlFor="faktur" className='text-xs pr-8'>Tipe Bayar</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="relative w-[200px] text-xs">
                    <SelectValue placeholder="Tipe Bayar" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK" className="text-xs ">Transfer Bank</SelectItem>
                    <SelectItem value="CASH" className="text-xs ">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentType === "BANK" && (
                <div className='gap-4'>
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="bank" className="text-xs pr-8">Bank</Label>
                    <Select
                      value={bankValue !== undefined ? String(bankValue) : ""}
                      onValueChange={val => setBankValue(Number(val))}
                    >
                      <SelectTrigger className="relative w-[200px] text-xs">
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

                  </div>
                  <div className="flex  justify-between">
                    <Label htmlFor="Pemasok" className='text-xs '>No. Bank</Label>
                    <div className="relative w-[200px] bg-gray-100 py-2 rounded-sm text-xs ">
                      <p className='ml-2'>{selectedBank?.code || '-'}</p>

                    </div>
                  </div>
                </div>
              )}


              <div className="flex  justify-between">
                <Label htmlFor="Pemasok" className='text-xs pr-8'>Jatuh Tempo</Label>

                <div className="relative w-[200px] bg-gray-100 py-2 rounded-sm text-xs pl-2">
                  <p>
                    {selectedTransaction ? dateForm(selectedTransaction.due_date) : '-'}
                  </p>
                </div>
              </div>

              <div className="flex  justify-between">
                <Label htmlFor="note" className='text-xs pr-8'>Keterangan</Label>


                <Input
                  type='text'
                  className='w-[200px] text-black border hover:bg-white justify-start text-left font-normal text-xs bg-white'
                  placeholder='Keterangan'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />


              </div>

              {/* ✅ PERBAIKAN DIMULAI DARI SINI */}
              <div className="border rounded-md overflow-auto mb-2">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow></TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction ? (
                      <>
                        <TableRow>
                          <TableCell className="w-1/3 text-xs">Jumlah Hutang</TableCell>
                          <TableCell className="text-right border-l pr-3 max-w-[200px]">
                            {`Rp${selectedTransaction.remaining_amount.toLocaleString('id-ID')}`}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="w-1/3 text-xs">Diskon</TableCell>
                          <TableCell className="text-right border-l p-0 max-w-[200px]">
                            <Input
                              type="number"
                              placeholder="0"
                              className="bg-gray-100 w-full text-right max-w-[200px] border-0 m-0 p-0 rounded-none"
                              value={diskon}
                              min={0}
                              max={jumlahHutang}
                              onChange={e => {
                                const val = e.target.value;
                                setDiskon(val === '' ? '' : Number(val));
                              }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="w-1/3 text-xs">Total Hutang</TableCell>
                          <TableCell className="text-right border-l pr-3 max-w-[200px]">
                            {`Rp${Math.max(totalHutang, 0).toLocaleString('id-ID')}`}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="w-1/3 text-xs">Pembayaran</TableCell>
                          <TableCell className="text-right border-l p-0 max-w-[200px]">
                            <Input
                              type="number"
                              placeholder="Rp0"
                              className="w-full max-w-[200px] bg-gray-100 text-right border-0 m-0 p-0 rounded-none"
                              value={pembayaran}
                              min={0}
                              max={totalHutang}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                  setPembayaran('');
                                  return;
                                }
                                const numericVal = Number(val);
                                setPembayaran(numericVal > totalHutang ? totalHutang : numericVal);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="w-1/3 text-xs">Sisa Hutang</TableCell>
                          <TableCell className="text-right border-l pr-3 max-w-[200px]">
                            {`Rp${sisaHutang.toLocaleString('id-ID')}`}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-400">
                          Tidak ada detail hutang
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mb-0 pb-0">
                <Button className="bg-blue-500 hover:bg-blue-600" onClick={onSubmit}>
                  Bayar
                </Button>
              </div>
              {/* ✅ PENUTUP PERBAIKAN */}
            </>
          )}
        </div>
      </div>
    </div>
  );

};

export default DetailHutangModal;
