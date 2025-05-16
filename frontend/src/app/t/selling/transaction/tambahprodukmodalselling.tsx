"use client";

import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { addRow } from "@/store/features/tableSlicer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
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
import useSWR from "swr";
import { cn, fetcher } from "@/lib/utils";
import Loading from "@/components/loading";
import { DistributorDropdown } from "@/components/dropdown-checkbox/distributor-dropdown";
import { CategoryDropdown } from "@/components/dropdown-checkbox/category-dropdown";
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TambahProdukModalProps {
  tableName: string;
  priceCategoryId: number;
}

const TambahProdukModalSelling: React.FC<TambahProdukModalProps> = ({ tableName, priceCategoryId = 1 }) => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [distributor, setDistributor] = useState<number[]>([]);
  const supplierParam = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";
  const priceCategory = priceCategoryId ?? 1;
  // const category = distributor.length > 0 ? `&supplier=${distributor.join(",")}` : "";

  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data = [], error, isLoading, mutate } = useSWR(
  `${API_URL}api/stock/?transaction_type=SALE${supplierParam}`,
  fetcher
);


  const handleAddProduct = (product: any) => {
  const selectedPrice = product.prices?.find((p: any) => p.price_category === priceCategory);

  const defaultQty = Number(product.jumlah_barang || 0);
  const quantity = defaultQty > 0 ? defaultQty : 1;
  const newItem = {
    stock: product.id,
    barcode: product.barcode,
    stock_code: product.code,
    stock_name: product.name,
    jumlah_pesanan: quantity,
    quantity: quantity,
    stock_price_buy: parseFloat(product.price_buy),
    stock_price_sell: selectedPrice ? parseFloat(selectedPrice.price_sell) : 0,
    unit: product.unit_name,
    prices: product.prices, 
  };
    
    toast.success(product.name + " Berhasil Ditambahkan");
    dispatch(addRow({ tableName, row: newItem }));
  };  
    

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <div
            className="flex items-center gap-2 cursor-pointer w-96"
            onClick={() =>
              setSorting([{ id: "name", desc: sorting[0]?.id === "name" ? !sorting[0]?.desc : false }])
            }
          >
            Produk {sorting[0]?.id === "name" && (sorting[0]?.desc ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
          </div>
        ),
      },
      { accessorKey: "available_quantity", header: "Jumlah Stok" },
      {
        accessorKey: "price_buy",
        header: "Harga Beli",
        cell: (info: any) => `Rp ${info.getValue().toLocaleString("id-ID")}`,
      },
      {
        header: "Harga Jual",
        // Kolom Harga Jual
        accessorFn: (row: any) => {
          const price = row.prices?.find((p: any) => p.price_category === priceCategory);
          return price ? `Rp ${Number(price.price_sell).toLocaleString("id-ID")}` : "-";
        },
      },      
      {
        accessorKey: "last_buy",
        header: "Last Buy",
        cell: ({ getValue }) => {
          const rawValue = getValue();
          if (!rawValue || typeof rawValue !== 'string') return "-";
          const parsedDate = new Date(rawValue);
          if (isNaN(parsedDate.getTime())) return "-";
          return format(parsedDate, "d/M/yyyy", { locale: id });
        },
      },
      {
        accessorKey: "last_sell",
        header: "Last Sell",
        cell: ({ getValue }) => {
          const rawValue = getValue();
          if (!rawValue || typeof rawValue !== 'string') return "-";
          const parsedDate = new Date(rawValue);
          if (isNaN(parsedDate.getTime())) return "-";
          return format(parsedDate, "d/M/yyyy", { locale: id });
        },
      },
      
      {
              accessorKey: "Action",
              header: "Action",
              cell: ({ row }: { row: Row<any> }) => {
                const product = row.original;
                const [quantity, setQuantity] = useState(product.jumlah_barang || "");
      
                const updateQuantity = (val: number | string) => {
                  if (val === "") {
                    setQuantity(""); // Allow empty value
                    row.original.jumlah_barang = ""; // Store empty value if needed
                  } else {
                    const value = Math.max(0, Number(val)); // Ensure non-negative numbers
                    setQuantity(value);
                    row.original.jumlah_barang = value; // Update the quantity in row
                  }
                };
      
                const increment = () => updateQuantity(quantity + 1);
                const decrement = () => updateQuantity(quantity - 1);
      
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded">
                      <input
                        type="number"
                        value={quantity}
                        placeholder="1"
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateQuantity(newValue); // Directly update based on input value
                        }}
                        className="w-10 h-5 bg-gray-200 text-center outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        min={0}
                      />
                    </div>
                    <Button
                      onClick={() => handleAddProduct(row.original)}
                      className="bg-blue-500 hover:bg-blue-600 size-5"
                    >
                      <Plus />
                    </Button>
                  </div>
                );
              },
              enableSorting: false,
            }
      
    ],
    [sorting]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    columnResizeMode: "onChange",
  columnResizeDirection: "ltr",
  defaultColumn: {
    size: 150,
    minSize: 50,
    maxSize: 600,
    enableResizing: true,
  },
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Produk</DialogTitle>
      </DialogHeader>


      <div>
        <div className="flex justify-between">
          <div className=" flex">
            <div className="my-2 relative w-56">
              <DistributorDropdown onChange={(ids) => setDistributor(ids)} />
            </div>
            <div className="my-2 relative w-56">
              <CategoryDropdown />
            </div>
          </div>
          <div className="my-2 relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Cari"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] max-w-screen overflow-x-auto overflow-y-auto rounded-t-md">
        <div className="w-max min-w-[1000px] text-sm border-separate border-spacing-0">
            <Table className=" bg-white">
              <TableHeader className="bg-gray-100 sticky top-0 z-10 border">
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, rowIndex) => (
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
                        className={cn(
                          "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis",
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-100"
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
        <ScrollBar orientation="horizontal"/>
        </ScrollArea>
      </div>

    </div>
  );
};

export default TambahProdukModalSelling;
