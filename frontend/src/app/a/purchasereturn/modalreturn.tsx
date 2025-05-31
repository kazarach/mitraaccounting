import Loading from "@/components/loading"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, ColumnResizeDirection } from "@tanstack/react-table"
import { format } from "date-fns"
import React from "react"

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function PurchaseReturnDetailModal({
    open,
    onClose,
    transaction,
    isLoading,
    error
  }: {
    open: boolean
    onClose: (open: boolean) => void
    transaction: any  // isi transaksi lengkap, termasuk items, tanggal, dsb
    isLoading?: boolean
    error?: string | null
  }) {
    const data = transaction?.items || [];
    const [columnResizeDirection, setColumnResizeDirection] = React.useState<ColumnResizeDirection>('ltr');
  
    const columns: ColumnDef<any>[] = [
      { header: "No.", accessorFn: (_, i) => i + 1 , size:100},
      { header: "Nama Produk", accessorKey: "stock_name" },
      { header: "Jumlah", accessorKey: "quantity" },
      {
        header: "Harga Beli",
        accessorKey: "stock_price_buy",
        cell: ({ getValue }) => {
          const raw = getValue();
          const value = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : 0;
          return `Rp ${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
        }
      },      
      { header: "Satuan", accessorKey: "unit" },
      {
        header: "Total Harga Beli",
        accessorKey: "total",
        cell: ({ getValue }) => {
          const raw = getValue();
          const value = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : 0;
          return `Rp ${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
        }
      },      
    ];
  
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        columnResizeDirection,
        enableColumnResizing: true,
        columnResizeMode: 'onChange'
    });

    const exportToExcel = () => {
          if (!data || data.length === 0) return;
    
          // Buat format data yang sesuai untuk Excel
          const exportData = data.map((item: any, index: number) => ({
            "No.": index + 1,
            "Tanggal": transaction?.th_date
            ? format(new Date(transaction.th_date), "dd/MM/yyyy")
            : "-",
            "Nama Produk": item.stock_name,
            "Jumlah": item.quantity,
            "Harga Beli": item.stock_price_buy,
            "Satuan": item.unit,
            "Total Harga Beli": item.netto
          }));
    
          const worksheet = XLSX.utils.json_to_sheet(exportData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Pembelian");
    
          const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    
          const filename = `Arsip_Retur_Pembelian_${transaction?.supplier_name || "data"}.xlsx`;
          saveAs(dataBlob, filename);
        };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogTitle>Detail Arsip Retur Pembelian</DialogTitle>
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <div><span className="font-semibold text-black">Tanggal:</span>{" "}
          {transaction?.th_date ? format(new Date(transaction.th_date), "dd/MM/yyyy") : "-"}</div>
          <div><span className="font-semibold text-black">Distributor:</span> {transaction?.supplier_name || "-"}</div>
        </div>

        <ScrollArea className= "h-[calc(100vh-290px)] overflow-x-auto overflow-y-auto max-w-screen">
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
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-blue-300 touch-none"
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
                      <TableCell colSpan={columns.length} className="text-center top-[-150px] relative">
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
                        Pilih Tanggal terlebih dahulu!
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        style={{ position: 'relative', height: '35px' }}
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

        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={exportToExcel}>Cetak</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
