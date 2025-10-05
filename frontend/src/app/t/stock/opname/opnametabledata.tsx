"use client";
import React, { useState } from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from "zod"
import { id } from 'date-fns/locale'
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
// import BayarTPModalJual from './previewmodal';
import TambahProdukModalOpname from './tambahprodukmodal';
import CashierOpnameDD from './cashier';

type Customer = {
    id: number;
    name: string;
    price_category?: {
      id: number;
      name: string;
    };
  };   

const formSchema = z.object({
    th_date: z.string({
        required_error: "Pilih Tanggal!"
    }).datetime({ message: "Pilih Tanggal!" }),
    customer: z.number({
        required_error: "Pilih Customer!"
      }).nullable(),      
    th_disc: z.number({
        required_error: "Masukkan Diskon Nota"
    }),
    sales: z.number().nullable()
})

interface TransactionRow {
    id: number;
    stock: number;
    barcode: string;
    stock_code: string;
    stock_name: string;
    unit: string;
    jumlah_pesanan: number;
    quantity: number;
    stock_price_buy: number;
    stock_price_sell: number;
    discount: number;
    netto: number;
    total: number;
    satuan: string;
    isi_packing: number;
    subtotal: number;
    jumlah:number;

    prices?: {
        price_category: number;
        price_sell: string;
    }[]; // ⬅️ TAMBAHKAN INI
}


interface Props {
    tableName: string;
}

const OpnameTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = React.useState<Date>()
    const [value, setValue] = React.useState("")
    const [isPpnIncluded, setIsPpnIncluded] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [previewData, setPreviewData] = useState<any>(null); // untuk menyimpan response dari API
    const [thDisc, setThDisc] = useState(0);
    const [thDp, setThDp] = useState(0); // Tambahkan ini
    const [cashierId, setCashierId] = useState<number | null>(null);    

    const data = useSelector((state: RootState) => state.table[tableName] || []);
    // console.log("🟡 data dari Redux:", data);

    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            th_date: new Date().toISOString(),
            customer: undefined,
            th_disc: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        toast.success("Form berhasil dihapus!")
        console.log(values)
        dispatch(clearTable({ tableName }));
    }

    const updateHargaJualByCustomer = (priceCategoryId: number) => {
        const updated = data.map((item) => {
          const selectedPrice = item.prices?.find((p: any) => p.price_category === priceCategoryId);
          return {
            ...item,
            stock_price_sell: selectedPrice ? parseFloat(selectedPrice.price_sell) : item.stock_price_sell,
          };
        });
      
        dispatch(setTableData({ tableName, data: updated }));
      };      

    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Code",
            accessorKey: "stock_code",
        },
        {
            header: "Nama Barang",
            accessorKey: "stock_name",
        },
        {
            header: "Satuan",
            accessorKey: "unit",
        },
        {
            id: 'Total Barang',
            header: "Harga Beli",
            cell: ({ row }) => {
              const stock_price_buy = row.original.stock_price_buy;
          
              return (
                <div className="text-left">
                  {Number(stock_price_buy).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
          },
          {
            id:'jumlah sistem',
            header: "Jumlah Sistem",
            accessorKey: 'jumlah',
            cell: ({ row }) => {
              const sistem = row.original.jumlah;
          
              return (
                <div className="text-left">
                  {Number(sistem).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </div>
              );
            },
          },
        {
            id:'quantity',
            header: "Jumlah Fisik",
            cell: ({ row }) => {
                const initialQty = row.original.quantity ?? 0;
                const [localQty, setLocalQty] = useState(initialQty);

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                const parsed = parseFloat(value);
                setLocalQty(value === "" ? 0 : isNaN(parsed) ? 0 : parsed); // izinkan kosong saat mengetik
                };

                const handleBlur = () => {
                handleChange(
                    { target: { value: localQty.toString() } } as React.ChangeEvent<HTMLInputElement>,
                    row.original.id,
                    "quantity"
                );
                };

                return (
                <input
                    type="number"
                    value={localQty}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                    placeholder="0"
                />
                );
            },
            },
            
            {
            header: "Perubahan",
            cell: ({ row }) => {
                const sistem = row.original.jumlah || 0;
                const quantity = row.original.quantity || 0;
                const subtotal = quantity - sistem;
                return (
                <div className="">{subtotal.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
                );
            },
            },
            {
            header: "Keterangan",
            cell: ({ row }) => {
                const sistem = row.original.jumlah || 0;
                const quantity = row.original.quantity || 0;
                const subtotal = quantity - sistem;
                const hargabeli = row.original.stock_price_buy || 0;
                const change = hargabeli * subtotal;
                return (
                <div className="">{change.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
                );
            },
            },
        {
            header: "Action",
            cell: ({ row }) => (
                <div className="text-left">
                    <Button
                        onClick={() => {
                            handleDelete(row.original.id);
                            toast.error("Produk berhasil dihapus!");
                        }}
                        className="bg-red-500 hover:bg-red-600 size-7"
                    >
                        <Trash />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: "onChange",
        columnResizeDirection: "ltr",
        defaultColumn: {
            size: 140,
            minSize: 50,
            maxSize: 600,
            enableResizing: true,
        },
    });


    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        rowId: number,
        field: 'quantity' | 'stock_price_sell' | 'discount'
        ) => {
        const value = parseFloat(e.target.value) || 0;

        const updatedData = data.map((item) => {
            if (item.id !== rowId) return item;

            const updatedItem = { ...item };

            if (field === 'quantity') {
            updatedItem.quantity = value;
            } else if (field === 'stock_price_sell') {
            updatedItem.stock_price_sell = value;
            } else if (field === 'discount') {
            updatedItem.discount = value;
            }

            const totalHarga = (updatedItem.stock_price_sell ?? 0) - (updatedItem.discount ?? 0);
            updatedItem.subtotal = (updatedItem.quantity ?? 0) * totalHarga;

            return updatedItem;
        });

        dispatch(setTableData({ tableName, data: updatedData }));
        };

    
    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Tabel berhasil dihapus!");
      
        form.reset({
          th_date: new Date().toISOString(), // ← reset ke hari ini atau kosongkan
          customer: null,
          th_disc: 0,
        });
      
        setCustomer(null);
      };
      
      const getTotalWithPPN = () => {
        const total = data.reduce((acc, item) => {
          const harga = Number(item.stock_price_sell) || 0;
          const quantity = Number(item.quantity) || 0;
          return acc + (harga * quantity);
        }, 0);
      
        const th_disc = form.getValues("th_disc") || 0;
        const totalSetelahDiskon = total * (1 - th_disc / 100);
      
        return isPpnIncluded ? totalSetelahDiskon * 1.11 : totalSetelahDiskon;
      };
            
      const th_disc = form.watch("th_disc") || 0;
      const [isBayarModalOpen, setIsBayarModalOpen] = useState(false);
      
      const postOpname = async () => {
        const transactionId = previewData?.transactionId;
        const operator_id = form.getValues("sales");

        if (!data.length) {
            toast.error("Silakan tambahkan produk terlebih dahulu.");
            return;
          }          
        try {
            const items = data
            .filter(item => typeof item.id === "number")
            .map(item => ({
                stock: item.stock,
                stock_code: item.stock_code,
                stock_name: item.stock_name,
                quantity: Number(item.quantity || 0),
                satuan: item.unit || "",
                stock_price_buy: Number(item.stock_price_buy || 0),
                sell_price: Number(item.stock_price_sell || 0),
                disc: Number(item.discount || 0),
            }));          
            console.log("✅ items yang akan dikirim:");
            console.table(items);
      
          const payload = {
            th_type: 7, // ← masih wajib karena backend minta
            th_payment_type:"CASH",
            cashier: operator_id,
            ...(transactionId && { id: transactionId }),
            items,
          };
      
          const API_URL = process.env.NEXT_PUBLIC_API_URL!;
          const endpoint = `/api/proxy/api/transactions/`;
      
          console.log("Payload:", JSON.stringify(payload, null, 2));
      
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
      
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
          }
      
          const result = await response.json();
        console.log("Response dari server:", result);
        toast.success("Data dari table berhasil dikirim!");

        // ✅ Bersihkan data & reset form
        dispatch(clearTable({ tableName }));
        } catch (error) {
          console.error("Gagal kirim data:", error);
          toast.error("Gagal mengirim data.");
        }
      };            

    return (
        <div className="flex flex-col space-y-4 ">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className="flex justify-between gap-4 mb-4">
                        <div>
                            <FormField
                                control={form.control}
                                name="sales"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Operator</FormLabel>
                                    <FormControl>
                                        <CashierOpnameDD
                                        onChange={(id, data) => {
                                            field.onChange(id); // isi field 'sales'
                                        }}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                        </div>
                        <div className='flex items-end gap-2'>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600 cursor-pointer">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh]">
                                <TambahProdukModalOpname
                                    tableName="opname"
                                    priceCategoryId={customer?.price_category?.id ?? 1}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer'>Batal</Button>
                        </div>
                    </div>

                    <div className="h-[calc(100vh-300px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
                    <div className="w-max text-sm border-separate border-spacing-0 min-w-full">
                        <Table>
                            <TableHeader className="bg-gray-100 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="relative h-[40px]">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                    key={header.id}
                                    style={{
                                        position: "absolute",
                                        left: header.getStart(),
                                        width: header.getSize(),
                                    }}
                                    className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100 overflow-hidden whitespace-nowrap"
                                    >
                                    {flexRender(header.column.columnDef.header, header.getContext())}

                                    {header.column.getCanResize() && (
                                        <div
                                        onMouseDown={header.getResizeHandler()}
                                        onTouchStart={header.getResizeHandler()}
                                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-blue-300"
                                        style={{ transform: "translateX(50%)" }}
                                        />
                                    )}
                                    </TableHead>
                                ))}
                                </TableRow>
                            ))}
                            </TableHeader>

                        <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="relative h-[40px]">
                                {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    style={{
                                    position: "absolute",
                                    left: cell.column.getStart(),
                                    width: cell.column.getSize(),
                                    height: "100%",
                                    }}
                                    className="text-left p-2 border-b border-r last:border-r-0 whitespace-nowrap overflow-hidden"
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                             <TableCell
                                colSpan={columns.length}
                                className="text-center text-gray-400 bg-gray-200"
                            >
                                Belum menambahkan produk
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>

                        <TableFooter className="sticky bg-gray-100 bottom-0 z-10 border-2">
                        <TableRow className="relative h-[40px]">
                            {table.getHeaderGroups()[0].headers.map((header, index) => {
                            const column = header.column;
                            let content: React.ReactNode = "";

                            // Tetapkan isi berdasarkan index kolom
                            switch (header.column.id) {
                                case 'Total Barang':
                                content = "Total Barang:";
                                break;
                                case 'jumlah sistem': {
                                const totalJumlahSistem = data.reduce((acc, item) => acc + (Number(item.jumlah) || 0), 0);
                                content = totalJumlahSistem.toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                break;
                                }
                                case 'quantity':
                                content = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
                                break;
                                case 'Perubahan':
                                content = data.reduce((acc, item) => {
                                    const sistem = item.jumlah || 0;
                                    const quantity = item.quantity || 0;
                                    const subtotal = quantity - sistem;
                                    return acc + subtotal;
                                }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                break;
                                case 'Keterangan':
                                content = data.reduce((acc, item) => {
                                    const sistem = item.jumlah || 0;
                                    const quantity = item.quantity || 0;
                                    const subtotal = quantity - sistem;
                                    const hargabeli = item.stock_price_buy || 0;
                                    const change = hargabeli * subtotal;
                                    return acc + change;
                                }, 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
                                break;
                                default:
                                content = "";
                            }

                            return (
                                <TableCell
                                key={column.id}
                                style={{
                                    position: "absolute",
                                    left: column.getStart(),
                                    width: column.getSize(),
                                    height: "100%",
                                }}
                                className="text-left font-bold border-b border-r last:border-r-0 whitespace-nowrap p-2 bg-gray-100"
                                >
                                {content}
                                </TableCell>
                            );
                            })}
                        </TableRow>
                        </TableFooter>

                        </Table>
                    </div>
                    </div>
                    <div className='flex justify-end gap-2 mt-4 '>
                        <Button
                        type="button"
                        onClick={postOpname}
                        className='font-medium bg-blue-500 hover:bg-blue-600 cursor-pointer'
                        >
                        Simpan
                        </Button>                            
                    </div>
                </form>
            </Form >
        </div>
    );
};

export default OpnameTable;