"use client";

import React, { useState } from "react";

interface PriceData {
  price_category: string;
  price_category_name: string;
  hpp: number;
  margin: number;
  price_sell: number;
  hjNow: number;
}

export default function PriceTable() {
  const [data, setData] = useState<PriceData[]>([
    {
      price_category: "A",
      price_category_name: "Category A",
      hpp: 10000,
      margin: 2000,
      price_sell: 12000,
      hjNow: 12000,
    },
    // data lainnya ...
  ]);

  // State sementara untuk simpan input yang sedang diedit sebelum blur
  const [tempInputs, setTempInputs] = useState<{ margin: string; hjNow: string }[]>(
    data.map((d) => ({ margin: d.margin.toString(), hjNow: d.hjNow.toString(), hpp: d.hpp }))
  );

  // Saat user ketik margin, update tempInputs saja dulu
  const onMarginInputChange = (index: number, value: string) => {
    setTempInputs((prev) => {
      const copy = [...prev];
      copy[index].margin = value;
      return copy;
    });
  };

  // Saat blur margin, update data dengan menghitung ulang hjNow = hpp + margin baru
  const onMarginInputBlur = (index: number) => {
    const newMargin = parseFloat(tempInputs[index].margin) || 0;
    setData((prev) => {
      const copy = [...prev];
      copy[index].margin = newMargin;
      copy[index].hjNow = copy[index].hpp + newMargin;
      return copy;
    });
    // Sinkronisasi tempInputs agar tetap sesuai data setelah update
    setTempInputs((prev) => {
      const copy = [...prev];
      copy[index].margin = (copy[index].margin = newMargin.toString());
      copy[index].hjNow = (copy[index].hjNow = (copy[index].hpp + newMargin).toString());
      return copy;
    });
  };

  // Saat user ketik hjNow, update tempInputs saja dulu
  const onHjNowInputChange = (index: number, value: string) => {
    setTempInputs((prev) => {
      const copy = [...prev];
      copy[index].hjNow = value;
      return copy;
    });
  };

  // Saat blur hjNow, update data dengan nilai hjNow baru
  const onHjNowInputBlur = (index: number) => {
    const newHjNow = parseFloat(tempInputs[index].hjNow) || 0;
    setData((prev) => {
      const copy = [...prev];
      copy[index].hjNow = newHjNow;
      return copy;
    });
    // Sinkronisasi tempInputs
    setTempInputs((prev) => {
      const copy = [...prev];
      copy[index].hjNow = newHjNow.toString();
      return copy;
    });
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Hpp</th>
          <th>Margin</th>
          <th>Harga Jual</th>
          <th>HJ Now</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={i} className="border">
            <td className="border-x w-[120px]">{`${p.price_category}. ${p.price_category_name}`}</td>
            <td className="border-x w-[120px]">{p.hpp}</td>
            <td className="border-x p-0 w-[120px]">
              <input
                type="number"
                className="w-full text-right p-0 py-2 pr-1 bg-gray-100 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={tempInputs[i].margin}
                onChange={(e) => onMarginInputChange(i, e.target.value)}
                onBlur={() => onMarginInputBlur(i)}
              />
            </td>
            <td className="border-x w-[120px] text-right">{p.price_sell}</td>
            <td className="border-x p-0 w-[120px]">
              <input
                type="number"
                className="w-full text-right p-0 py-2 pr-1 bg-gray-100 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={tempInputs[i].hjNow}
                onChange={(e) => onHjNowInputChange(i, e.target.value)}
               
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
