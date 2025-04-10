// TambahProdukModal.js
"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp, Check, ChevronsUpDown, Command } from "lucide-react";
import { distributors, products } from "@/data/product";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
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
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";

interface OrderModalProps {
  tableName: string;
}

const OrderModal: React.FC<OrderModalProps> = ({ tableName }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const handleAddProduct = (product: any) => {
    const newItem = {
      name: product.name,
      jumlah_pesanan: product.jumlah_pesanan ?? 1,
      harga_beli: product.purchasePrice,
      subtotal: product.purchasePrice * (product.jumlah_pesanan ?? 1),
    };
    toast.success(product.name + " Berhasil Ditambahkan");
    dispatch(addRow({ tableName, row: newItem }));
  };
  

  const distributors = [
    {
      value: "1",
      label: "Distributor A",
    },
    {
      value: "2",
      label: "Distributor B",
    },
    {
      value: "3",
      label: "Distributor C",
    },
    {
      value: "4",
      label: "Distributor D",
    },
    {
      value: "5",
      label: "Distributor E",
    },

  ]

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() =>
              setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
            }
          >
            Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
          </div>
        ),
      },
      { accessorKey: "barcode", header: "Barcode" },
      { accessorKey: "quantityOutput", header: "Jumlah Stok" },
      { accessorKey: "boughtLast7Days", header: "Terbeli (7H)" },
      { accessorKey: "boughtLast30Days", header: "Terbeli (30H)" },
      { accessorKey: "soldLast7Days", header: "Terjual (7H)" },
      { accessorKey: "soldLast30Days", header: "Terjual (30H)" },
      {
        accessorKey: "purchasePrice",
        header: "Harga Beli",
        cell: (info : any) => `Rp${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        accessorKey: "jumlahInput",
        header: "Jumlah",
        cell: ({ row }: { row: Row<any> }) => {
          const product = row.original;
          const [quantity, setQuantity] = useState(product.jumlah_pesanan || 1);

          const updateQuantity = (val: number) => {
            const value = Math.max(1, val);
            setQuantity(value);
            row.original.jumlah_pesanan = value; // ⬅️ simpan langsung ke row
          };
      
          const increment = () => updateQuantity(quantity + 1);
          const decrement = () => updateQuantity(quantity - 1);
      
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={decrement}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-12 text-center border rounded"
                min={1}
              />
              <button
                onClick={increment}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: { row: Row<any> }) => (
          <Button onClick={() => handleAddProduct(row.original)} className="bg-blue-500 hover:bg-blue-600 size-7">
            <Plus />
          </Button>
        ),
        enableSorting: false,
      },      
    ],
    [sorting]
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
  });

    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [open2, setOpen2] = React.useState(false)
    const [value2, setValue2] = React.useState("")

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Pesanan Penjualan</DialogTitle>
      </DialogHeader>
      <div className="flex items-center gap-4 my-5">
        <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Kategori</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value
                          ? distributors.find((d) => d.value === value)?.label
                          : "Pilih Kategori"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Distributor" />
                        <CommandList>
                          <CommandEmpty>No Distributor found.</CommandEmpty>
                          <CommandGroup>
                            {distributors.map((d) => (
                              <CommandItem
                                key={d.value}
                                value={d.value} 
                                data-value={d.value} 
                                onSelect={() => {
                                    setValue(d.value);
                                    setOpen(false);
                                  }}
                                  
                              >
                                {d.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === d.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
        <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Distributor</Label>
                  <Popover open={open2} onOpenChange={setOpen2}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open2}
                        className="w-[200px] justify-between font-normal"
                      >
                        {value2
                          ? distributors.find((d) => d.value === value2)?.label
                          : "Pilih Distributor"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search Distributor" />
                        <CommandList>
                          <CommandEmpty>No Distributor found.</CommandEmpty>
                          <CommandGroup>
                            {distributors.map((d) => (
                              <CommandItem
                                key={d.value}
                                value={d.label} 
                                data-value={d.value} 
                                onSelect={(currentLabel: string) => {
                                  const selectedDistributor = distributors.find((dist) => dist.label === currentLabel);
                                  if (selectedDistributor) {
                                    setValue2(selectedDistributor.value);
                                  } else {
                                    setValue2("");
                                  }
                                  setOpen2(false);
                                }}
                              >
                                {d.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value2 === d.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="my-2 relative w-1/4 top-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                    placeholder="Cari Produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10"
                    />
                </div>
            </div>
      <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[68vh] bg-white relative">
        <Table className="w-full min-w-[1000px] bg-white">
          <TableHeader className="sticky top-0 bg-gray-100 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-left">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-white">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-left">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderModal;