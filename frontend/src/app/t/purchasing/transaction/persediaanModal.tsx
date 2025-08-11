"use client";

import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DialogHeader } from '@/components/ui/dialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, fetcherPost } from '@/lib/utils';
import { Description, DialogTitle } from '@radix-ui/react-dialog'
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from '@tanstack/react-table';
import { error } from 'console';
import { ArrowRightLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import useSWRMutation from 'swr/mutation';
import ProductDropdown from './produkDropdown';



interface PersediaanProps {
    stockData?: any;
}

export type Stock = {
    id: number;
    name: string;
    available_quantity: number;
    barcode: string;
    unit_name: string;
    supplier_name: string;
    category_name: string;
};


const PersediaanModal: React.FC<any> = ({ stockData,
    selectedStock = null,
    setSelectedStock,onClose }) => {

    const safeSetSelectedStock = setSelectedStock ?? (() => { });

    const API_URL = process.env.NEXT_PUBLIC_API_URL!
    const [selectedStock2, setSelectedStock2] = React.useState<any>(null);
    const [tambahQty1, setTambahQty1] = useState<number | "">("");
    const [tambahQty2, setTambahQty2] = useState<number | "">("");

    useEffect(() => {
         if (!selectedStock2) return;
        if (tambahQty1 === "" || tambahQty1 === 0) {
            setTambahQty2("");
        } else {
            setTambahQty2(-tambahQty1);
        }
    }, [tambahQty1, selectedStock2]);

    const { trigger, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `/api/proxy/api/transactions/`,
        fetcherPost
    );


    const simpanClick = async () => {
        if (
            !selectedStock || !selectedStock2 ||
            tambahQty1 === "" || tambahQty2 === "" ||
            tambahQty1 === 0 || tambahQty2 === 0
        ) {
            toast.error("Kedua produk & qty harus diisi (qty ≠ 0)!");
            return;
        }


        const items = [
            {
                stock: selectedStock.id,
                stock_code: selectedStock.code || "",
                stock_name: selectedStock.name,
                quantity: Number(tambahQty1),
            },
            {
                stock: selectedStock2.id,
                stock_code: selectedStock2.code || "",
                stock_name: selectedStock2.name,
                quantity: Number(tambahQty2),
            }
        ];

        const payload = {
            th_type: 7,
            cashier: 2,
            th_payment_type: "CASH",
            items,
        };


        trigger(payload)
            .then((res) => {
                console.log(res)
                toast.success("Ganti Persediaan Berhasil");
                if (onClose) onClose(); 

            })
            .catch((err) => {
                toast.error(err.message);
                console.log(err)
            });


    };




    return (
        <div>
            <DialogHeader>
                <DialogTitle className='font-bold'>Koreksi Persediaan</DialogTitle>
                <Description></Description>
            </DialogHeader>
            <div className='flex justify-end mb-2'>
                <Button
                    onClick={() => setSelectedStock2(null)}
                    className='border border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white'>
                    Clear
                </Button>
            </div>

            <div className='flex w-full items-center gap-1'>
                <Card className="w-1/2 h-full">
                    <CardContent>
                        <div className="flex  items-center">

                            <div className="w-full flex flex-col text-sm font-medium space-y-2">
                                <div className='flex items-center w-full justify-between'>
                                    <p>Produk</p>
                                    <div className="w-3/4">
                                        <ProductDropdown
                                            value={selectedStock ?? null}
                                            onChange={(stock) => {
                                                safeSetSelectedStock(stock);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Qty Sekarang</p>
                                    <div className="w-3/4">
                                        <input
                                            type="number"
                                            defaultValue={selectedStock?.available_quantity}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Barcode"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Unit</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock?.unit_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Unit"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Barcode</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock?.barcode}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Barcode"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Category</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock?.category_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Kategori"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Supplier</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock?.supplier_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Supplier"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Tambah Qty</p>
                                    <div className="w-3/4">
                                        <input
                                            type="number"
                                            className="bg-gray-100 w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="0"
                                            value={tambahQty1}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const num = val === "" ? "" : Number(val);
                                                setTambahQty1(num);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>


                <Card className="w-1/2 h-full">
                    <CardContent>
                        <div className="flex  items-center">
                            <div className="w-full flex flex-col text-sm font-medium space-y-2">
                                <div className='flex items-center w-full justify-between'>
                                    <p>Produk</p>
                                    <div className="w-3/4">
                                        <ProductDropdown
                                            value={selectedStock2 ?? null}
                                            onChange={(stock) => {
                                                setSelectedStock2(stock);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Qty Sekarang</p>
                                    <div className="w-3/4">
                                        <input
                                            type="number"
                                            defaultValue={selectedStock2?.available_quantity}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Barcode"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Unit</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock2?.unit_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Unit"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Barcode</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock2?.barcode}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Barcode"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Category</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock2?.category_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Kategori"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Supplier</p>
                                    <div className="w-3/4">
                                        <input
                                            type="text"
                                            defaultValue={selectedStock2?.supplier_name}
                                            className="w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="Supplier"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center w-full justify-between'>
                                    <p>Tambah Qty</p>
                                    <div className="w-3/4">
                                        <input
                                            type="number"
                                            className="bg-gray-100 w-full h-[36px] border rounded-md px-2 text-sm"
                                            placeholder="0"
                                            value={tambahQty2}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const num = val === "" ? "" : Number(val);
                                                setTambahQty2(num);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>



                    </CardContent>
                </Card>
            </div>
            <div className='flex justify-end gap-2 mt-4 '>

                <div className='gap-2 flex'>
                    <Button
                        onClick={simpanClick}
                        className='font-medium bg-blue-500 hover:bg-blue-600'
                    >
                        Simpan
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default PersediaanModal
