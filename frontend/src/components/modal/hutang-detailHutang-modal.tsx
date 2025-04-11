"use client";
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HutangData } from '@/data/product';
import { CalendarIcon } from 'lucide-react';
import { Table, TableHeader, TableRow, TableBody, TableCell } from '../ui/table';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';

interface DetailHutangProps {
  kodePemasok: string;
}

const DetailHutangModal: React.FC<DetailHutangProps> = ({ kodePemasok }) => {
  const dataHutang = HutangData.filter((data) => data.kodePemasok === kodePemasok);
  const data = dataHutang[0];
  const [date, setDate] = React.useState<Date>()
  return (
    <div className=" flex flex-col " >
      <DialogHeader>
        <DialogTitle className="text-sm font-bold text-gray-800 mb-2">
          Pembayaran Hutang - {data.namaPemasok}
        </DialogTitle>
      </DialogHeader>

      <div className="flex  gap-4 mb-3 ">
        <div className="flex flex-col gap-2 justify-between w-full">
          <div className="flex justify-between" >
            <Label htmlFor="date" className='text-xs '>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal text-xs",

                  )}
                >
                  <CalendarIcon />
                  {date ? format(date, "PPP") : <span>Pilih Tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex  justify-between">
            <Label htmlFor="Pemasok" className='text-xs '>Pemasok</Label>
            <div className="relative w-[200px] bg-gray-100 py-2 rounded-sm text-xs ">
              <p className='ml-2' > {data.namaPemasok} </p>
            </div>

          </div>
          <div className="flex  justify-between">
            <Label htmlFor="faktur" className='text-xs '>No. Faktur</Label>
            <Select >
              <SelectTrigger className="relative w-[200px] bg-gray-100 text-xs">
                <SelectValue placeholder="No Faktur" className='text-xs' />
              </SelectTrigger>
              <SelectContent>
                {data.itemHutang.map((item) => (
                  <SelectItem key={item.id} value={item.noFaktur} className='text-xs'>
                    {item.noFaktur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex  justify-between">
            <Label htmlFor="faktur" className='text-xs '>Tipe Bayar</Label>
            <Select >
              <SelectTrigger className="relative w-[200px] bg-gray-100 text-xs">
                <SelectValue placeholder="No Faktur" className='text-xs' />
              </SelectTrigger>
              <SelectContent>
                {data.itemHutang.map((item) => (
                  <SelectItem key={item.id} value={item.noFaktur} className='text-xs'>
                    {item.noFaktur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex  justify-between">
            <Label htmlFor="faktur" className='text-xs '>Kas</Label>
            <Select >
              <SelectTrigger className="relative w-[200px] bg-gray-100 text-xs">
                <SelectValue placeholder="No Faktur" className='text-xs'/>
              </SelectTrigger>
              <SelectContent>
                {data.itemHutang.map((item) => (
                  <SelectItem key={item.id} value={item.noFaktur} className='text-xs'>
                    {item.noFaktur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex  justify-between">
            <Label htmlFor="Pemasok" className='text-xs pr-8'>Jatuh Tempo</Label>

            <div className="relative w-[200px] bg-gray-100 py-2 rounded-sm text-xs ">
              <p className='ml-2' > {data.itemHutang[0].jatuhTempo} </p>
            </div>

          </div>
          <div className="flex  justify-between">
            <Label htmlFor="faktur" className='text-xs '>Nota Retur</Label>
            <Select >
              <SelectTrigger className="relative w-[200px] bg-gray-100 text-xs">
                <SelectValue placeholder="No Faktur" className='text-xs' />
              </SelectTrigger>
              <SelectContent>
                {data.itemHutang.map((item) => (
                  <SelectItem key={item.id} value={item.noFaktur} className='text-xs'>
                    {item.noFaktur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className='border rounded-md overflow-auto mb-2 '>
        <Table  >
          <TableHeader>
            <TableRow>

            </TableRow>
          </TableHeader>


          <TableBody>
            <TableRow >
              <TableCell >Jumlah Hutang</TableCell>
              <TableCell className="text-right border-l pr-3">{`Rp${data.itemHutang[0].jumlahHutang.toLocaleString('id-ID')}`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Diskon</TableCell>
              <TableCell className="text-right border-l p-0">
                <Input type='number' placeholder='0%' className='bg-gray-100 text-right border-0 m-0 p-0 rounded-none' />
              </TableCell>
            </TableRow>
            <TableRow >
              <TableCell>Total Hutang</TableCell>
              <TableCell className="text-right border-l pr-3">{`Rp${data.itemHutang[0].totalHutangSetelahDiskon.toLocaleString('id-ID')}`}</TableCell>
            </TableRow>
            <TableRow >
              <TableCell>Pembayaran</TableCell>
              <TableCell className="text-right border-l p-0 ">
                <Input type='number' placeholder='Rp0' className='bg-gray-100 text-right border-0 m-0 p-0 rounded-none' />
              </TableCell>
            </TableRow>
            <TableRow >
              <TableCell>Sisa Hutang</TableCell>
              <TableCell className="text-right border-l pr-3">{`Rp${data.itemHutang[0].sisaHutang.toLocaleString('id-ID')}`}</TableCell>
            </TableRow>
          </TableBody>

        </Table>
      </div>
       <div className="flex justify-end mb-0 pb-0">
          <Button className="bg-blue-500 hover:bg-blue-600">Bayar</Button>

        </div>
    </div>

  );
};

export default DetailHutangModal;
