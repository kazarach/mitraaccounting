"use client"
import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import HPModal from '@/components/modal/detailHutangPiutang-modal';
import { kasirData } from '@/data/product';
import { Label } from '@radix-ui/react-label';

const Kasir = () => {
    const [date, setDate] = useState<Date>();
    const [selectedCashier, setSelectedCashier] = useState('John Doe');
    const [filteredData, setFilteredData] = useState(kasirData);

    useEffect(() => {
        if (selectedCashier === 'all') {
            setFilteredData(kasirData);
        } else {
            setFilteredData(kasirData.filter(item => item.operator === selectedCashier));
        }
    }, [selectedCashier]);

    const handleCashierChange = (value: string) => {
        setSelectedCashier(value);
    };

    return (
        <div className="flex  w-full pt-4">
            <Card className="w-1/2 mx-4">
                <CardHeader>
                    <CardTitle>Kasir</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between gap-4 mb-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="date">Tanggal</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className="w-[200px] justify-start text-left font-normal"
                                            >
                                                <CalendarIcon />
                                                {date ? format(date, "PPP") : <span>Tanggal</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="kasir">Kasir</Label>
                                    <Select onValueChange={handleCashierChange}>
                                        <SelectTrigger className="relative w-[200px] bg-gray-100">
                                            <SelectValue placeholder="Select Cashier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="John Doe">John Doe</SelectItem>
                                            <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                                            <SelectItem value="Sarah Lee">Sarah Lee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {filteredData.length > 0 && (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Variabel</TableHead>
                                            <TableHead className="text-left">Nilai</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    {filteredData.map((data) => (
                                        <TableBody key={data.id}>
                                            <TableRow >
                                                <TableCell>Penjualan Netto</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.penjualanNetto.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Kredit</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.kredit.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Debit</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.debit.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Voucher</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.voucher.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Cek/Giro</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.cekGiro.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Tunai</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.tunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Retur</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.retur.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Rincian Kas Tunai</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.rincianKasTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>saldo Awal</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.saldoAwal.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Kas Penjualan Tunai</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.kasPenjualanTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Kas DP Pesanan</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.kasDPPesanan.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Bayar Piutang</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.bayarPiutang.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Retur Penjualan Bayar Tunai</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.returPenjualanBayarTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Penerimaan Lain</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.penerimaanLain.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Pengeluaran Lain</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.pengeluaranLain.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Pembelian Tunai</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.pembelianTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Setor Kasir</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.rincianKasTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Saldo Akhir</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.setorKasir.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Jenis Transaksi</TableCell>
                                                <TableCell className="text-left">{`${data.jumlahJenisTransaksi.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Bayar Piutang Via Retur</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.bayarPiutangViaRetur.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Bayar Piutang Via Bank</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.bayarPiutangViaBank.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Bayar Piutang Via Giro</TableCell>
                                                <TableCell className="text-left">{`Rp ${data.bayarPiutangViaGiro.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Nota Penjualan</TableCell>
                                                <TableCell className="text-left">{`${data.jmlNotaPenjualan.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Batal Penjualan</TableCell>
                                                <TableCell className="text-left">{`${data.jmlBatalPenjualan.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Koreksi Penjualan</TableCell>
                                                <TableCell className="text-left">{`${data.jmlKoreksiPenjualan.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Retur Penjualan</TableCell>
                                                <TableCell className="text-left">{`${data.jmlReturPenjualan.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Pembayaran Piutang</TableCell>
                                                <TableCell className="text-left">{`${data.rincianKasTunai.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Jumlah Mutasi Masuk</TableCell>
                                                <TableCell className="text-left">{`${data.jmlMutasiMasuk.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                            <TableRow >
                                                <TableCell>Saldo Mutasi Keluar</TableCell>
                                                <TableCell className="text-left">{`${data.jmlMutasiKeluar.toLocaleString('id-ID')}`}</TableCell>
                                            </TableRow>
                                        </TableBody>

                                    ))}
                                </Table>
                            </div>
                        )}
                        {filteredData.length === 0 && (
                            <div className="text-center text-gray-400">
                                No data available for the selected cashier.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                                                <Button className="bg-blue-500 hover:bg-blue-600">Cetak</Button>
                                                <Button className="bg-blue-500 hover:bg-blue-600">Setor</Button>
                                                <Button className="bg-green-500 hover:bg-green-600">Simpan Excel</Button>
                                            </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default Kasir;
