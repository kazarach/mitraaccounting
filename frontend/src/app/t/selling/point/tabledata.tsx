"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { Eye, PencilLine, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useSidebar } from '@/components/ui/sidebar';
import { ColumnResizeDirection, ColumnDef, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import useSWR, { mutate } from 'swr';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Loading from '@/components/loading';
import { TukarPointModal } from './modal-point';
import { Dialog } from '@/components/ui/dialog';
import DetailPointModal from './modal-detailpoint';
import { Input } from '@/components/ui/input';

const RedeemPoint = () => {
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const [searchQuery, setSearchQuery] = useState('');
  const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const { data: json, error, isLoading } = useSWR(`/api/proxy/api/customers/`, fetcher);
  
  const flatData = useMemo(() => {
    if (!json) return [];
    
    return json.map((transaction: any, index: number) => ({
      id: transaction.id,
      name: transaction.name,
      address: transaction.address,
      point: transaction.point,
      operator: transaction.cashier_username,
      duedate: format(new Date(transaction.duedate), "dd/MM/yyyy"),
    }));
  }, [json]);
  // console.log("data", json)
      

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
    { header: "No.", accessorFn: (_, i) => i + 1, size:50 },
    { header: "Nama", accessorKey: "name", size:200},
    { header: "Alamat", accessorKey: "address", size:400 },
    { header: "Kadaluarsa", accessorKey: "duedate", size:120},
    { header: "Jumlah Poin", accessorKey: "point", size:120,
      cell: ({ getValue }) => {
        const raw = getValue();
        const num = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : NaN;

        return isNaN(num)
          ? "-"
          : num.toLocaleString("id-ID", {
              // minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
      }
     },
    {
      header: "Edit",
      size: 60,
      id: "action",
      cell: ({ row }) => {
      const transaksi = row.original;
      // console.log("Klik edit", transaksi);


        return (
          <div className="flex gap-2">
            <div>
              <Button
              className="size-7 bg-green-500 hover:bg-green-600 cursor-pointer"
              style={{
                position: 'relative',
                pointerEvents: 'auto', // ⬅️ ini yang penting
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (transaksi) {
                  setSelectedTransaction(transaksi);
                  setIsDialogOpen(true);
                }
              }}
            >
            <PencilLine />
          </Button>

            </div>
          </div>
        );
      },
    },
    {
      header: "Detail",
      size: 200,
      cell: ({ row }) => {
      const transaksi = row.original;

      return (
        <div className="flex gap-2">
          <div>
            <Button
              className="size-7 bg-blue-500 hover:bg-blue-600 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (transaksi) {
                  setSelectedTransaction(transaksi);
                  setIsDetailOpen(true);
                }
              }}
            >
              <Eye />
            </Button>
          </div>
        </div>
      );
    },
    }
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
      setIsDetailOpen(true);
    };

    useEffect(() => {
            const timeout = setTimeout(() => {
              searchInputRef.current?.focus();
            }, 100); // Delay kecil agar render selesai
          
            return () => clearTimeout(timeout);
          }, []);

  return (
    <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
              <h1 className='font-semibold'>
                Tukar Poin
              </h1>
              </div>              
              <div className='flex items-end gap-2'>
                <div className='relative w-64'>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        ref={searchInputRef}
                        placeholder="Cari"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10"
                      />
                  </div>
                </div>              
            </div>

            <ScrollArea className="h-[calc(100vh-180px)] w-full overflow-x-auto overflow-y-auto max-w-screen">
              <div className="w-max text-sm border-separate border-spacing-0 min-w-full">
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
                        className={cn(
                          "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap relative text-ellipsis",
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                        )}
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
                              "p-2 border-b border-r last:border-r-0 overflow-hidden whitespace-nowrap relative text-ellipsi",
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
             <TukarPointModal
          open={isDialogOpen}
          onClose={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              mutate(`/api/proxy/api/customers/`); // Memicu refetch data
            }
          }}
          transaction={selectedTransaction}
        />
            )}
            {isDetailOpen && selectedTransaction && (
              <DetailPointModal
                open={isDetailOpen}
                onClose={setIsDetailOpen}
                transaction={selectedTransaction}
              />
            )}

    </div>
  );
};

export default RedeemPoint; 