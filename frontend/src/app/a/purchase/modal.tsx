import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

export function PurchaseDetailModal({
    open,
    onClose,
    transaction
  }: {
    open: boolean
    onClose: (open: boolean) => void
    transaction: any  // isi transaksi lengkap, termasuk items, tanggal, dsb
  }) {
    const data = transaction?.items || [];
  
    const columns: ColumnDef<any>[] = [
      { header: "No.", accessorFn: (_, i) => i + 1 },
      { header: "Nama Produk", accessorKey: "stock_name" },
      { header: "Jumlah", accessorKey: "quantity" },
      {
        header: "Harga Beli",
        accessorKey: "stock_price_buy",
        cell: ({ getValue }) => {
          const raw = getValue();
          const value = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : 0;
          return `Rp ${value.toLocaleString("id-ID", { minimumFractionDigits: 2 })}`;
        }
      },      
      { header: "Satuan", accessorKey: "unit" },
      {
        header: "Total Harga Beli",
        accessorKey: "total",
        cell: ({ getValue }) => {
          const raw = getValue();
          const value = typeof raw === "string" || typeof raw === "number" ? parseFloat(raw as string) : 0;
          return `Rp ${value.toLocaleString("id-ID", { minimumFractionDigits: 2 })}`;
        }
      },      
    ];
  
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>Detail Arsip Pembelian</DialogTitle>
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <div><span className="font-semibold text-black">Tanggal:</span>{" "}
          {transaction?.th_date ? format(new Date(transaction.th_date), "dd/MM/yyyy") : "-"}</div>
          <div><span className="font-semibold text-black">Distributor:</span> {transaction?.supplier_name || "-"}</div>
        </div>

        <ScrollArea className="max-h-[400px]">
        <div className="mt-4 max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} className="text-left">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Return</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Cetak</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
