"use client";
import React, { useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn, fetcher } from '@/lib/utils';
import { Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useSidebar } from '@/components/ui/sidebar';
import { ColumnResizeDirection, ColumnDef, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import useSWR from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { PurchaseDetailModal } from './modal-point';
import { Dialog } from '@/components/ui/dialog';

const PurchaseArchive = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data: json, error, isLoading } = useSWR(`${API_URL}api/customers/`, fetcher);

  const flatData = useMemo(() => {
    if (!json) return [];
  
    return json.map((transaction: any, index: number) => ({
      id: `${transaction.id}`,
      name: transaction.name,
      address: transaction.address,
      point: transaction.point,
      operator: transaction.cashier_username,
      duedate: format(new Date(transaction.duedate), "dd/MM/yyyy"),
    }));
  }, [json]);
  console.log("data", json)
      

    const filteredData = useMemo(() => {
        if (!searchQuery) return flatData;
        const lowerSearch = searchQuery.toLowerCase();
        
        return flatData.filter((item: any) =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(lowerSearch)
          )
        );
      }, [flatData, searchQuery]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { header: "Nama", accessorKey: "name", size:200},
    { header: "Alamat", accessorKey: "address", size:400 },
    { header: "Kadaluarsa", accessorKey: "duedate", size:200},
    { header: "Jumlah Poin", accessorKey: "point", size:200 },
    {
      header: "Action",
      size: 200,
      id: "action", // kolom tanpa accessorKey harus pakai id
      cell: ({ row }) => (
        <Button
          className='size-7 bg-blue-500'
          onClick={() => {
            const transaksiId = row.original.id;
            const transaksi = json?.find((t: any) => String(t.id) === transaksiId);
            if (transaksi) {
              setSelectedTransaction(transaksi);
              setIsDialogOpen(true);
            }
          }}
        >
          <Eye/>
        </Button>
      ),
    },
  ], []);
  
    const table = useReactTable({
      data: filteredData,
      columns,
      defaultColumn: {
        
      enableResizing: true,
      },
      getCoreRowModel: getCoreRowModel(),
      columnResizeDirection,
      enableColumnResizing: true,
      columnResizeMode: 'onChange'
    });

    const handleOpenDetail = (transaksi: any) => {
      setSelectedTransaction(transaksi);
      setIsDialogOpen(true);
    };

  return (
    <div className="flex justify-left w-auto px-4 pt-4">
          <Card
            className={cn(
              state === "expanded" ? "min-w-[180vh]" : "w-full",
              "min-h-[calc(100vh-80px)] transition-all duration-300"
            )}
          >
        {/* <CardHeader>
          <CardTitle>Arsip Pembelian</CardTitle>
        </CardHeader> */}
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
              <h1 className='font-semibold'>
                Tukar Poin
              </h1>
              </div>              
              <div className='flex items-end gap-2'>
                <div className={cn(
                          "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                        )}>
                    <Search size={20} style={{ marginRight: '10px' }} />
                    <input
                      type="text"
                      placeholder="Cari"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ border: 'none', outline: 'none', flex: '1' }}
                    />
                  </div>
                </div>              
            </div>

            <ScrollArea className="h-[calc(100vh-180px)] overflow-x-auto overflow-y-auto max-w-screen">
              <div className="w-max text-sm border-separate border-spacing-0 min-w-[100px]">
                <Table >
                <TableHeader className="bg-gray-100 sticky top-0 z-10" >
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} style={{ position: 'relative', height: '40px' }}>
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          style={{
                            position: 'absolute',
                            left: header.getStart(),   // ⬅️ posisi horizontal
                            width: header.getSize(),   // ⬅️ width sesuai header
                          }}
                          className="text-left font-bold text-black p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis bg-gray-100"
                        >
                          <div
                            className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{
                              lineHeight: '20px',
                              minHeight: '20px',
                            }}
                            title={String(header.column.columnDef.header ?? '')}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>

                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-300"
                            />
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center">
                        <Loading />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-red-500">
                        Gagal mengambil data
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-gray-400">
                        Tidak ada produk ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        onClick={() => {
                          const transaksiId = row.original.id;
                          const transaksi = json?.find((t: any) => String(t.id) === transaksiId);
                          if (transaksi) {
                            setSelectedTransaction(transaksi);
                            setIsDialogOpen(true);
                          }
                        }}
                        className="cursor-pointer "
                        style={{ position: 'relative', height: '40px' }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            style={{
                              position: 'absolute',
                              left: cell.column.getStart(),
                              width: cell.column.getSize(),
                              height: '100%',
                            }}
                            className={cn(
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap text-ellipsis",
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                            )}
                          >
                            <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis"
                              style={{
                                lineHeight: '20px',
                                minHeight: '20px',
                              }}
                              title={String(cell.getValue() ?? '')}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" className='z-40' />
            </ScrollArea>

            {isDialogOpen && selectedTransaction && (
              <PurchaseDetailModal
                open={isDialogOpen}
                onClose={setIsDialogOpen}
                transaction={selectedTransaction}
              />
            )}


          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseArchive; 