// TambahProdukModal.js
"use client";

import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp, Calendar, CalendarIcon, DollarSign, Trash } from "lucide-react";
import { products } from "@/data/product";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    SortingState,
    Row,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { useEffect } from "react";
import TambahProdukModal from "@/components/modal/tambahProduk-modal";
import TpModal from "@/components/modal/tp-pesanan-modal";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { setDate } from "date-fns";
import { format } from "path";
import { date } from "yup";

const fetcher = async (url: string) => {

    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (access) {
        headers["Authorization"] = `Bearer ${access}`;
    }
    if (refresh) {
        headers["x-refresh-token"] = refresh;
    }

    const res = await fetch(url, { headers });
    return await res.json();
};


interface TambahProdukModalProps {
    tableName: string;
}

const TestPanggil: React.FC<TambahProdukModalProps> = ({ tableName }) => {
    const { data, error, isLoading } = useSWR("http://127.0.0.1:8000/api/stock/", fetcher);

    useEffect(() => {
        console.log(data);
    }, [data]);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Terjadi kesalahan</p>;



    return (
        <>
            <div className="flex justify-center w-full pt-4">
                <Card className="w-full mx-4">
                    <CardHeader>
                        <CardTitle>Inin Produk ememk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">


                        </div>


                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produk</TableHead>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Jumlah Stok</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center text-gray-400 bg-gray-200">
                                                Belum menambahkan produk
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item : any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="font-medium">{item.barcode}</TableCell>
                                                <TableCell >{item.quantity}</TableCell>
                                               
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>

                                <TableFooter>
                                    
                                </TableFooter>
                            </Table>
                        </div>
                    
                    <div className='flex justify-end gap-2 mt-4 '>

                        <Button onClick={() => toast.success("Return Pembelian Berhasil")} className='font-medium bg-blue-500 hover:bg-blue-600  '>Input</Button>

                    </div>
                </CardContent>
            </Card>
        </div >
        </>
    );
};


export default TestPanggil;