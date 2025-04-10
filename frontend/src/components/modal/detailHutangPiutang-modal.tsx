"use client";
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HutangData } from '@/data/product';

const HPModal = () => {
  const data = HutangData[0]; // Ambil data pertama

  return (
    <div className=" space-y-4">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-gray-800">
          Detail Hutang - {data.kodePemasok}
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
        <div>
          <span className="font-semibold">Nama Pemasok:</span> <br />
          {data.namaPemasok}
        </div>
        <div>
          <span className="font-semibold">No Faktur:</span> <br />
          {data.noFaktur}
        </div>

        <div>
          <span className="font-semibold">Tanggal:</span> <br />
          {data.tanggal}
        </div>
        <div>
          <span className="font-semibold">Jatuh Tempo:</span> <br />
          {data.jatuhTempo}
        </div>

        <div>
          <span className="font-semibold">Detail:</span> <br />
          {data.detail}
        </div>
        <div>
          <span className="font-semibold">Tipe Pembayaran:</span> <br />
          {data.tipeBayar}
        </div>

        <div>
          <span className="font-semibold">Kas:</span> <br />
          {data.kas}
        </div>
        <div>
          <span className="font-semibold">Nota Retur:</span> <br />
          {data.notaRetur}
        </div>

        <div>
          <span className="font-semibold">Total Hutang:</span> <br />
          Rp {data.totalHutang.toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Diskon:</span> <br />
          {data.diskon}%
        </div>

        <div>
          <span className="font-semibold">Total Setelah Diskon:</span> <br />
          Rp {data.totalHutangSetelahDiskon.toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Pembayaran:</span> <br />
          Rp {data.pembayaran.toLocaleString()}
        </div>

        <div className="col-span-2">
          <span className="font-semibold">Sisa Hutang:</span> <br />
          <span className="text-red-600 text-lg font-bold">
            Rp {data.sisaHutang.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HPModal;
