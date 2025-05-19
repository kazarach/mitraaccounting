import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" min-w-[30vw]">
        <div className=" flex flex-col " >
            <DialogHeader>
                <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
                    Detail Tukar Poin
                </DialogTitle>
            </DialogHeader>

            <div className="flex  gap-4 mb-3 ">
                <div className="flex flex-col gap-2 justify-between w-full">
                    <div className="flex justify-between" >
                    </div>


                </div>
            </div>
            <div className='border rounded-md overflow-auto mb-2 '>
                <Table  >
                    <TableHeader>
                        <TableRow className='font-semibold'>
                            <TableCell className='border-r'>Nama Pelanggan</TableCell>
                            <TableCell>
                                {transaction?.name}
                            </TableCell>
                        </TableRow>
                    </TableHeader>


                    <TableBody>
                        <TableRow >
                            <TableCell className='border-r' >Alamat</TableCell>
                            <TableCell className='text-right'>
                                {transaction?.address}
                            </TableCell>
                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>Kadaluarsa</TableCell>
                            <TableCell className='text-left'>
                                {format(new Date(transaction.duedate), "dd/MM/yyyy")}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jumlah Poin</TableCell>
                            <TableCell className="text-left border-l">
                                {transaction?.point}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow >
                            <TableCell className='border-r'>(+) Tambah Poin</TableCell>
                            <TableCell className="text-left border-l p-0 ">
                                <Input type='number' placeholder='0' className='bg-gray-100 border-0 m-0 p-2 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>(-) Tukar Poin</TableCell>
                            <TableCell className="text-left border-l p-0 ">
                                <Input type='number' placeholder='0' className='bg-gray-100 border-0 m-0 p-2 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Pembulatan</TableCell>
                            <TableCell className="text-right border-l">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className='font-bold'>Total Net</TableCell>
                            <TableCell className="text-right border-l font-bold">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>

                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Tipe Tukar Poin</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                            <Select>
                                <SelectTrigger className="relative w-full bg-white text-sm border-0 rounded-none">
                                    <SelectValue placeholder="Pilih Tukar Poin" className='text-sm' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VOUCHER">Voucher</SelectItem>
                                    <SelectItem value="BANK">Transfer Bank</SelectItem>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                </SelectContent>
                            </Select>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Bank</TableCell>
                            <TableCell className="text-left border-l p-0">
                            
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Jatuh tempo</TableCell>
                            <TableCell className="text-left border-l  p-0 ">
                            
                        </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>No. Kartu</TableCell>
                            <TableCell className="text-left border-l p-0">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Subsidi</TableCell>
                            <TableCell className="text-left border-l p-0 ">
                                <Input type='number' placeholder='0' className='bg-gray-100 border-0 m-0 p-2 rounded-none ' />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>DP</TableCell>
                            <TableCell className="text-right border-l ">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className='font-bold'>Harus Dibayar</TableCell>
                            <TableCell className="text-right border-l font-bold">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Pembayaran</TableCell>
                            <TableCell className="text-left border-l p-0 ">

                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className=''>Kurang bayar</TableCell>
                            <TableCell className="text-right border-l ">
                            </TableCell>
                        </TableRow>
                    </TableBody>

                </Table>
            </div>
            <div className="flex justify-end mb-0 pb-0">
                <Button className="bg-blue-500 hover:bg-blue-600">Bayar</Button>

            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
