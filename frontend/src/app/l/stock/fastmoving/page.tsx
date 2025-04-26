"use client";

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Table, TableBody, TableCaption, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, fetcher } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Eye, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DateRange } from "react-day-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const FastMoving = () => {
  const distributors = [
    { value: "1", label: "Distributor A" },
    { value: "2", label: "Distributor B" },
    { value: "3", label: "Distributor C" },
    { value: "4", label: "Distributor D" },
    { value: "5", label: "Distributor E" },
  ];

  const [range, setRange] = useState("day");

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);  // Ubah ke undefined


  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : null;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : null;

  const { data, error, isLoading } = useSWR(
    startDate && endDate
      ? `http://100.82.207.117:8000/api/trans-items/fast_moving/?start_date=${startDate}&end_date=${endDate}`
      : range
      ? `http://100.82.207.117:8000/api/trans-items/fast_moving/?range=${range}`
      : null,  // Jika tidak ada parameter apapun, jangan lakukan fetch
    fetcher
  );
  // console.log("data:",data)

  return (
    <div className="flex justify-left w-full pt-4">
      <Card className="w-full mx-4">
        <CardHeader>
          <CardTitle>Fast Moving</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="distributor">Jenis Transaksi</Label>
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
                          : "Pilih Jenis Transaksi"}
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
                                  setValue(selectedDistributor?.value || "");
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
                  <Label htmlFor="date-range">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-range"
                        variant={"outline"}
                        className="w-[300px] justify-start text-left font-normal"
                        disabled={false}  // Disable jika range dipilih
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pilih Tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                      <Button className="m-4 ml-100" onClick={() => setDate(undefined)}>Hapus</Button>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="waktu">Waktu</Label>
                  <Select
                    value={range}
                    onValueChange={(val) => setRange(val)}
                    disabled={!!(startDate && endDate)}  // Menonaktifkan jika tanggal dipilih
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pilih Waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hari Ini</SelectItem>
                      <SelectItem value="week">Mingguan</SelectItem>
                      <SelectItem value="month">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>

              <div className='flex items-end gap-2'>
                <div className={cn(
                  "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex items-center h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                )}>
                  <Search size={20} style={{ marginRight: '10px' }} />
                  <input type="text" placeholder="Cari" style={{ border: 'none', outline: 'none', flex: '1' }} />
                </div>
              </div>
            </div>

            {isLoading && <p>Loading data...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}

            {!isLoading && !error && (
              <div className="rounded-md border overflow-auto">
                <Table className='table-striped'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor</TableHead>
                      <TableHead className="text-left">Barcode</TableHead>
                      <TableHead className="text-left">Nama</TableHead>
                      <TableHead className="text-left">Jumlah</TableHead>
                      <TableHead className="text-left">Pemasok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {data.map((item: any, index: number) => (
                    <TableRow key={item.stock_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-left">{item.stock_barcode}</TableCell>
                      <TableCell className="text-left">{item.stock_name}</TableCell>
                      <TableCell className="text-left">{item.total_quantity}</TableCell>
                      <TableCell className="text-left">{item.stock_supplier ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className='flex gap-2 justify-end'>
              <Button className='bg-blue-500 hover:bg-blue-600'>Cetak</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FastMoving;
