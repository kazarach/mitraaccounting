import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { usestockdata } from '@/data/product';
import { format } from 'date-fns';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DetailStockProps {
    noFaktur: string;  // Ensure this is a string for consistency with the `noFaktur` in `usestockdata`
}

const DetailUseStock: React.FC<DetailStockProps> = ({ noFaktur }) => {
    const selectedData = usestockdata.filter((data) => data.noFaktur === noFaktur);

    const columns = [
        { accessorKey: "kode", header: "Kode" },
        { accessorKey: "barcode", header: "Barcode" },
        { accessorKey: "produk", header: "Produk" },
        { accessorKey: "jumlah", header: "Jumlah" },
        { accessorKey: "satuan", header: "Satuan" },
        { accessorKey: "keterangan", header: "Keterangan" },
    ];

    const table = useReactTable({
        data: selectedData.length > 0 ? selectedData[0].items : [],  // Using the items of the first match
        columns: columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div>
            <DialogHeader>
                <DialogTitle>Detail Persediaan Pemakaian</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg overflow-x-auto mt-2">
                    <Table className="w-full">
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
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

export default DetailUseStock;
