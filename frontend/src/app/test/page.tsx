"use client"

import React, { useMemo } from "react"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, RowData } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Trash, Plus } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { setTableData, deleteRow, clearTable, addRow } from "@/store/features/tableSlicer"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface TransactionRow {
  id: number
  stock_name: string
  jumlah_pesanan: number
  quantity: number
  stock_price_buy: number
  disc?: number
  disc_percent?: number
  disc_percent2?: number
}

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

interface Props {
  tableName: string
}

const TransactionTable: React.FC<Props> = ({ tableName }) => {
  const dispatch = useDispatch()
  const data = useSelector((state: RootState) => state.table[tableName] || [])
  const [isPpnIncluded, setIsPpnIncluded] = React.useState(true)

  // ✅ Default editable cell
  const defaultColumn: Partial<ColumnDef<TransactionRow>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue()
      const [value, setValue] = React.useState(initialValue)

      const onBlur = () => {
        table.options.meta?.updateData(index, id, value)
      }

      React.useEffect(() => {
        setValue(initialValue)
      }, [initialValue])

      // Kolom non-editable
      if (id === "stock_name" || id === "total") {
        return <span>{value as string}</span>
      }

      return (
        <input
          type="number"
          value={value as number}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          className="pl-1 text-left bg-gray-100 rounded-sm w-full"
        />
      )
    },
  }

  const columns = useMemo<ColumnDef<TransactionRow>[]>(() => [
    { header: "Produk", accessorKey: "stock_name", size: 240 },
    { header: "Pesanan", accessorKey: "jumlah_pesanan", size: 80 },
    { header: "Jml. Barang", accessorKey: "quantity", size: 80 },
    { header: "Harga Beli", accessorKey: "stock_price_buy", size: 100 },
    { header: "Diskon (Rp)", accessorKey: "disc", size: 100 },
    { header: "Diskon (%)", accessorKey: "disc_percent", size: 90 },
    { header: "Diskon 2 (%)", accessorKey: "disc_percent2", size: 90 },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => {
        const r = row.original
        const price = r.stock_price_buy || 0
        const qty = r.quantity || 0
        const disc = r.disc || 0
        const disc1 = r.disc_percent || 0
        const disc2 = r.disc_percent2 || 0

        const afterDisc1 = price - disc
        const afterDisc2 = afterDisc1 - (afterDisc1 * disc1) / 100
        const afterDisc3 = afterDisc2 - (afterDisc2 * disc2) / 100
        const subtotal = qty * afterDisc3

        return <div className="text-right font-semibold">{subtotal.toLocaleString("id-ID")}</div>
      },
    },
    {
      header: "Action",
      cell: ({ row }) => (
        <div className="text-center">
          <Button
            onClick={() => handleDelete(row.original.id)}
            className="bg-red-500 hover:bg-red-600 size-7"
          >
            <Trash size={14} />
          </Button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        dispatch(setTableData({
          tableName,
          data: data.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...row,
                [columnId]: Number(value) || 0,
              }
            }
            return row
          })
        }))
      },
    },
  })

  const handleDelete = (id: number) => {
    dispatch(deleteRow({ tableName, id }))
    toast.error("Produk berhasil dihapus!")
  }

  const handleClear = () => {
    dispatch(clearTable({ tableName }))
    toast.error("Table berhasil dihapus!")
  }

  const handleAddRow = () => {
    const newRow: TransactionRow = {
      id: Date.now(),
      stock_name: "Produk Baru",
      jumlah_pesanan: 0,
      quantity: 0,
      stock_price_buy: 0,
      disc: 0,
      disc_percent: 0,
      disc_percent2: 0,
    }
    dispatch(addRow({ tableName, row: newRow }))
    toast.success("Baris baru ditambahkan")
  }

  const totalSummary = useMemo(() => {
    const subtotal = data.reduce((acc, r) => {
      const price = r.stock_price_buy || 0
      const qty = r.quantity || 0
      const disc = r.disc || 0
      const disc1 = r.disc_percent || 0
      const disc2 = r.disc_percent2 || 0

      const afterDisc1 = price - disc
      const afterDisc2 = afterDisc1 - (afterDisc1 * disc1) / 100
      const afterDisc3 = afterDisc2 - (afterDisc2 * disc2) / 100
      return acc + qty * afterDisc3
    }, 0)

    const totalPPN = isPpnIncluded ? 0 : subtotal * 0.11
    const totalAfterPPN = subtotal + totalPPN

    return { subtotal, totalAfterPPN }
  }, [data, isPpnIncluded])

  return (
    <div className="p-4">
      <div className="flex justify-between mb-2">
        <Button onClick={handleAddRow} className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
          <Plus size={16} /> Tambah Data
        </Button>
        <Button variant="outline" onClick={handleClear}>Clear Table</Button>
      </div>
      <table className="border-collapse border w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border px-2 py-1 bg-gray-100">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold border">Total:</TableCell>
            <TableCell colSpan={2} className="text-left font-bold border">
              {totalSummary.subtotal.toLocaleString("id-ID")}
            </TableCell>
            <TableCell colSpan={2} className="text-left font-bold border">
              {totalSummary.totalAfterPPN.toLocaleString("id-ID")}
            </TableCell>
          </TableRow>
        </TableFooter>
      </table>
    </div>
  )
}

export default TransactionTable