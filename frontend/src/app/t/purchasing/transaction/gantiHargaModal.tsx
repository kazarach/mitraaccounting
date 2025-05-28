"use client";

import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { DialogHeader } from '@/components/ui/dialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, fetcherPost } from '@/lib/utils';
import { Description, DialogTitle } from '@radix-ui/react-dialog'
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from '@tanstack/react-table';
import { error } from 'console';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import useSWRMutation from 'swr/mutation';



interface GantiHargaModalProps {
    priceData: any;


}

const GantiHargaModal: React.FC<GantiHargaModalProps> = ({ priceData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any[]>(priceData || []);

    useEffect(() => {
        const cloned = (priceData || []).map((item: any) => ({
            ...item,
            prices: item.prices.map((p: any) => ({
                ...p,
                sell_price_manual:
                    Number(item.stock_price_buy) + Number(p.margin || 0),
            })),
        }));
        setData(cloned);
    }, [priceData]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL!

    const { trigger, data: tsc, error: tscerror, isMutating: tscmutating } = useSWRMutation<
        any,
        any,
        string,
        any
    >(
        `${API_URL}api/stock/update_prices/`,
        fetcherPost
    );


    const handleMarginChange = (productIndex: number, priceIndex: number, newMargin: number) => {
        setData(prevData => {
            const newData = [...prevData];
            const item = { ...newData[productIndex] };
            const updatedPrices = [...item.prices];
            const p = updatedPrices[priceIndex];

            const updatedPrice = {
                ...p,
                margin: newMargin,
                sell_price_manual: Number(item.stock_price_buy) + Number(newMargin),
            };

            updatedPrices[priceIndex] = updatedPrice;
            item.prices = updatedPrices;
            newData[productIndex] = item;
            return newData;
        });
    };



    const handleSellPriceChange = (productIndex: number, priceIndex: number, newSellPrice: number) => {
        setData(prevData => {
            const newData = [...prevData];
            newData[productIndex] = { ...newData[productIndex] };
            const updatedPrices = [...newData[productIndex].prices];
            updatedPrices[priceIndex] = { ...updatedPrices[priceIndex], sell_price_manual: newSellPrice };
            newData[productIndex].prices = updatedPrices;
            return newData;
        });
    };


    const proccessClick = async () => {
        const payload = {
            items: data.flatMap((item: any) =>
                item.prices.map((p: any) => ({
                    stock_id: item.id,
                    price_category_id: p.price_category,
                    sell_price: Number(p.sell_price_manual || 0).toFixed(2),
                }))
            ),
        };
        console.log(payload)

        trigger(payload)
            .then((res) => {
                console.log(res)
                toast.success("Ganti Harga Berhasil");
            })
            .catch((err) => {
                toast.error(err.message);
            });

    };




    const columns: ColumnDef<any>[] = [
        { accessorKey: "barcode", header: "Barcode" },


        { accessorKey: "code", header: "Kode" },
        { accessorKey: "name", header: "Produk" },
        {
            accessorKey: "stock_price_buy",
            header: "HPP",
            cell: ({ getValue }) => `Rp${Number(getValue()).toLocaleString("id-ID")}`,
        },
        {
            accessorKey: "prices",
            header: "Harga",
            cell: ({ row }) => {
                const prices = data[row.index]?.prices || [];
                const hpp = data[row.index]?.stock_price_buy;

                return (
                    <Table className="w-full border m-0 p-0">
                        <TableHeader>
                            <TableRow>
                                <TableHead className='text-center'>Kategori</TableHead>
                                <TableHead className='text-center'>Margin</TableHead>
                                <TableHead className='text-center'>HJ Lama</TableHead>
                                <TableHead className='text-center'>HJ Sekarang</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prices.map((p: any, i: number) => {
                                const HJNow = Number(hpp) + Number(p.margin || 0);
                                return (
                                    <TableRow key={i}>
                                        <TableCell className='w-[120px]'>{`${p.price_category}. ${p.price_category_name}`}</TableCell>
                                        <TableCell className='p-0 w-[150px]'>
                                            <input
                                                type="number"
                                                defaultValue={p.margin}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    handleMarginChange(row.index, i, isNaN(val) ? 0 : val);
                                                }}
                                                className="w-full text-right p-0 py-2 pr-1 bg-gray-100 appearance-none
                                                           [&::-webkit-inner-spin-button]:appearance-none 
                                                            [&::-webkit-outer-spin-button]:appearance-none 
                                                            [moz-appearance:textfield]"
                                            />
                                        </TableCell>
                                        <TableCell className="w-[120px] text-right">{p.price_sell}</TableCell>
                                        <TableCell className='p-0 w-[150px]'>
                                            <input
                                                type="number"
                                                defaultValue={p.sell_price_manual}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    handleSellPriceChange(row.index, i, isNaN(val) ? 0 : val);
                                                }}
                                                className="w-full text-right p-0 py-2 pr-1 bg-gray-100 appearance-none
             [&::-webkit-inner-spin-button]:appearance-none 
             [&::-webkit-outer-spin-button]:appearance-none 
             [moz-appearance:textfield]"
                                            />

                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                );
            }
        }
        // { accessorKey: "cashier_username", header: "Operator" },

    ];


    const table = useReactTable({
        data: priceData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });


    return (
        <div>
            <DialogHeader>
                <DialogTitle className='font-bold'>Ganti Harga</DialogTitle>
                <Description></Description>
            </DialogHeader>


            <div>

                <ScrollArea className="h-[calc(100vh-250px)] max-w-screen overflow-x-auto overflow-y-auto  rounded-t-md">
                    <div className="w-[90vw] text-sm border-separate border-spacing-0 min-w-full ">
                        <Table className=" bg-gray-100 rounded-md">
                            <TableHeader className="sticky top-0  z-20 bg-gray-100 ">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className=" ">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className={cn(
                                                "text-left font-bold text-black p-2 border-b border-r last:border-r-0  ",
                                            )}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className='bg-gray-300'>
                                {!priceData || priceData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center py-6">
                                            <Loading />
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row, rowIndex) => (
                                        <TableRow key={row.id} className="bg-white">
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className={cn(
                                                        "text-left  truncate w-[85px] p-2 border-b border-r first:border-l last:border-r", rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50',

                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center text-gray-400">
                                            Tidak ada produk ditemukan
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
            <div className='flex justify-between gap-2 mt-4 '>
                <Button
                    className='font-medium bg-blue-500 hover:bg-blue-600'
                >
                    Recalculate
                </Button>
                <div className='gap-2 flex'>
                    <Button
                        className='font-medium bg-blue-500 hover:bg-blue-600'
                        onClick={proccessClick}
                    >
                        Proses
                    </Button>

                    <Button
                        className='font-medium bg-red-500 hover:bg-red-600'
                    >
                        Batal
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default GantiHargaModal
