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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import BayarTPModal from '@/components/modal/tp-bayar-modal';
import CustomerDDTS from './customer-dd';
import TambahProdukModalSelling from './tambahprodukmodalselling';
import TpModalSelling from './modalpesanan';

type Customer = {
    id: number;
    name: string;
  };

const formSchema = z.object({
    th_date: z.string({
        required_error: "Pilih Tanggal!"
    }).datetime({ message: "Pilih Tanggal!" }),
    customer: z.number({
        required_error: "Pilih Customer!"
    }),
    th_disc: z.number({
        required_error: "Masukkan Diskon Nota"
    }),
    // items: z.array(z.object({
    //     stock: z.number(),
    //     quantity: z.number(),
    //     stock_price_buy: z.number(),
    //     unit: z.number(),
    //     disc: z.number(),
    //     total: z.string(),
    //     netto: z.number(),
    // }))
})

interface TransactionRow {
    id:number;
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
  }


interface Props {
    tableName: string;
}

const TransactionSellingTable: React.FC<Props> = ({ tableName }) => {
    const dispatch = useDispatch();
    const [date, setDate] = React.useState<Date>()
    const [value, setValue] = React.useState("")
    const [isPpnIncluded, setIsPpnIncluded] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);

    const data = useSelector((state: RootState) => state.table[tableName] || []);
    console.log("🟡 data dari Redux:", data);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            th_date: new Date().toISOString(),
            customer: undefined,
            th_disc: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        toast.success("Form berhasil disubmit!")
        console.log(values)
        dispatch(clearTable({ tableName }));
    }

    const columns: ColumnDef<TransactionRow>[] = [
        {
            header: "Produk",
            accessorKey: "stock_name",
        },
        {
            header: "Jumlah Barang",

            cell: ({ row }) => {
                const jumlahBarang = row.original.quantity || 0;

                return (
                    <input
                        type="number"
                        value={jumlahBarang}
                        onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleChange({ target: { value: val.toString() } } as any, row.original.id, 'quantity');
                        }}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                        placeholder="0"
                    />
                );
            },
        },
        {
            header: "Satuan",
            accessorKey: "unit",
        },
        {
            header: "Harga Beli",
            cell: ({ row }) => {
                const stock_price_buy = row.original.stock_price_buy || 0;

                return (
                    <input
                        type="number"
                        defaultValue={stock_price_buy}
                        onBlur={(e) => handleChange(e, row.original.id, 'stock_price_buy')}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                        placeholder="0"
                    />
                );
            },
        },
        {
            header: "Harga Jual",
            cell: ({ row }) => {
                const stock_price_buy = row.original.stock_price_buy || 0;

                return (
                    <input
                        type="number"
                        defaultValue={stock_price_buy}
                        onBlur={(e) => handleChange(e, row.original.id, 'stock_price_buy')}
                        className="pl-1 text-left w-24 bg-gray-100 rounded-sm"
                        placeholder="0"
                    />
                );
            },
        },
        {
            header: "Diskon (Rp)",
            cell: () => (
                <input
                    type="number"
                    className="pl-1 text-left w-20 bg-gray-100 rounded-sm"
                    placeholder="Rp0"
                />
            ),
        },
        {
            header: "Total",
            cell: ({ row }) => {
                const harga = Number(row.original.stock_price_buy) || 0;
                const quantity = Number(row.original.quantity) || 0;
                const subtotal = harga * quantity;
                return (
                    <div className="">Rp{subtotal.toLocaleString("id-ID")}</div>
                );
            },
        },
        {
            header: "Inc. PPN",
            cell: ({ row }) => {
                const harga = row.original.stock_price_buy || 0;
                const quantity = row.original.quantity || 0;
                const subtotal = (harga * quantity);
                const finalTotal = isPpnIncluded ? subtotal : subtotal * 1.11;
                return (
                    <div className="text-left">Rp{finalTotal.toLocaleString("id-ID")}</div>
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
    });


    const handleCheckboxChange = (checked: boolean) => {
        setIsPpnIncluded(!!checked);
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowId: number, field: string) => {
        const value = parseFloat(e.target.value) || 0;
    
        const updatedData = data.map((item) => {
            if (item.id === rowId) {
                const updatedItem = { ...item };
    
                if (field === 'quantity') {
                    updatedItem.quantity = value;
                } else if (field === 'stock_price_buy') {
                    updatedItem.stock_price_buy = value;
                }
    
                updatedItem.subtotal = updatedItem.quantity * updatedItem.stock_price_buy;
                return updatedItem;
            }
            return item;
        });
    
        dispatch(setTableData({ tableName: "s_transaksi", data: updatedData }));
    };
    
    const handleDelete = (id: number) => {
        dispatch(deleteRow({ tableName, id }));
        toast.error("Produk berhasil dihapus!");
    };

    const handleClear = () => {
        dispatch(clearTable({ tableName }));
        toast.error("Table berhasil dihapus!");
    };

    const getTotalWithPPN = () => {
        return data.reduce((acc, item) => {
          const harga = Number(item.stock_price_buy) || 0;
          const quantity = Number(item.quantity) || 0;
          const subtotal = harga * quantity;
          const final = isPpnIncluded ? subtotal : subtotal * 1.11;
          return acc + final;
        }, 0);
      };
      
      const postOnlyTableItems = async () => {
        try {
            const items = data
            .filter(item => typeof item.id === "number")
            .map(item => ({
                stock: item.stock,
                stock_code: item.stock_code,
                stock_name: item.stock_name,
                quantity: String(item.quantity || 0),
                satuan: item.unit || "",
                stock_price_buy: String(item.stock_price_buy || 0),
                // sell_price: String(item.stock_price_sell || 0),
                disc: String(item.discount || 0),
            }));          
            console.log("✅ items yang akan dikirim:");
            console.table(items);

            const customer_id = form.getValues("customer"); // sudah ID, bukan name
      
          const payload = {
            th_type: "SALE", // ← masih wajib karena backend minta
            customer: customer_id,
            items
          };
      
          const API_URL = process.env.NEXT_PUBLIC_API_URL!;
          const endpoint = `${API_URL}api/transactions/calculate_preview/`;
      
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
          toast.success("Data dari modal berhasil dikirim ke server!");
        } catch (error) {
          console.error("Gagal kirim data:", error);
          toast.error("Gagal mengirim data.");
        }
      };            

    return (
        <div className="flex flex-col space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <div className="flex justify-between gap-4 mb-4">

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="th_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tanggal</FormLabel>
                                            <FormControl>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-[150px] h-[30px] justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value
                                                                ? format(new Date(field.value), "d MMMM yyyy", { locale: id })
                                                                : <span>Pilih Tanggal</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={(date) => {
                                                                field.onChange(date?.toISOString() ?? "")
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                            {/* <FormMessage /> */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                            <FormField
                                control={form.control}
                                name="customer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <FormControl>
                                        <CustomerDDTS
                                        value={customer?.id ?? null}
                                        onChange={(selectedCustomer) => {
                                            setCustomer(selectedCustomer);
                                            field.onChange(selectedCustomer?.id ?? null);
                                        }}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <FormField
                                    control={form.control}
                                    name="th_disc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Diskon Nota</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className='bg-gray-100 h-[30px] w-[150px]'
                                                    placeholder='0%'
                                                />
                                            </FormControl>
                                            {/* <FormMessage /> */}
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex  gap-2 items-center pb-2">
                                <Checkbox
                                    id="terms"
                                    checked={isPpnIncluded}
                                    onCheckedChange={handleCheckboxChange}
                                    className="size-5 items-center"
                                />

                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Termasuk PPN
                                </label>

                            </div>
                        </div>
                        <div className='flex items-end gap-2'>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className='font-medium bg-blue-500 hover:bg-blue-600'>Pesanan</Button>
                                </DialogTrigger>
                                <DialogContent className="w-[70vw] max-h-[90vh]">
                                    <TpModalSelling />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-medium bg-blue-500 hover:bg-blue-600">Tambah Produk</Button>
                                </DialogTrigger>
                                <DialogContent className="w-[100vw] max-h-[90vh]">
                                    <TambahProdukModalSelling tableName='s_transaksi' />
                                </DialogContent>
                            </Dialog>
                            <Button onClick={handleClear} variant={"outline"} className='font-medium border-red-500 text-red-500 hover:bg-red-500 hover:text-white '>Batal</Button>

                        </div>
                    </div>

                    <div className="rounded-md border overflow-auto overflow-x-hidden">
                        <Table>
                            <TableHeader className="bg-gray-100 sticky top-0 z-10" >
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 bg-gray-100">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="text-left p-2 border-b border-r last:border-r-0">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center text-gray-400 bg-gray-200 ">
                                            Belum menambahkan produk
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-white">
                                    <TableCell colSpan={8} className="text-right font-bold">
                                        Total:
                                    </TableCell>
                                    <TableCell className="text-left font-bold">
                                        Rp{getTotalWithPPN().toLocaleString("id-ID")}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                    <div className='flex justify-end gap-2 mt-4 '>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="button"
    onClick={postOnlyTableItems} className='font-medium bg-blue-500 hover:bg-blue-600'>Simpan</Button>
                            </DialogTrigger>
                            <DialogContent className="w-[30vw] max-h-[90vh]">
                                <BayarTPModal  />
                            </DialogContent>
                        </Dialog>

                    </div>

                </form>
            </Form >
        </div>
    );
};

export default TransactionSellingTable;
