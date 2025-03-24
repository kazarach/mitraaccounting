"use client";
import React, { useEffect, useState } from 'react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check, ChevronsUpDown, Copy, Plus, Search, Trash } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addRow, deleteRow, setTableData, clearTable } from '@/store/features/tableSlicer';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Row, useReactTable } from '@tanstack/react-table';
import { distributors, operators, pesananList, products } from '@/data/product';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const TpModal = () => {
  const [search, setSearch] = useState("");
  const [date, setDate] = React.useState<Date>()
  const [open, setOpen] = React.useState(false)
  const [open2, setOpen2] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [value2, setValue2] = React.useState("")

  const handleAddProduct = () => {
    toast.success(" Berhasil Ditambahkan")
  };

  const columns: ColumnDef<typeof pesananList[number]>[] = [
    { accessorKey: "noFaktur", header: "No Faktur" },
    { accessorKey: "tanggal", header: "Tanggal" },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ getValue }) => `Rp${Number(getValue()).toLocaleString("id-ID")}`,
    },
    {
      accessorKey: "DP",
      header: "DP",
      cell: ({ getValue }) => `Rp${Number(getValue()).toLocaleString("id-ID")}`,
    },
    { accessorKey: "pemasok", header: "Pemasok" },
    { accessorKey: "operator", header: "Operator" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }: { row: Row<any> }) => (
        <Button onClick={() => handleAddProduct} className="bg-blue-500 hover:bg-blue-600 size-7">
          <Plus />
        </Button>
      ),
      enableSorting: false,
    },
  ];
  const table = useReactTable({
    data: pesananList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setSearch,
    state: { globalFilter: search }
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Pesanan</DialogTitle>
      </DialogHeader>
      <div>
        <div className='my-2 flex gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",

                )}
              >
                <CalendarIcon />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
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
          <div className="flex flex-col space-y-2">
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
                    : "Select Distributor"}
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
                            if (selectedDistributor) {
                              setValue(selectedDistributor.value);
                            } else {
                              setValue("");
                            }
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
            
            <Popover open={open2} onOpenChange={setOpen2}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open2}
                  className="w-[200px] justify-between font-normal"
                >
                  {value2
                    ? operators.find((d) => d.id === value2)?.name
                    : "Select Operator"}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search Operator" />
                  <CommandList>
                    <CommandEmpty>No Operator found.</CommandEmpty>
                    <CommandGroup>
                      {operators.map((d) => (
                        <CommandItem
                          key={d.id}
                          value={d.name}
                          data-value={d.id}
                          onSelect={(currentLabel: string) => {
                            const selectedOperator = operators.find((operator) => operator.name === currentLabel);
                            if (selectedOperator) {
                              setValue2(selectedOperator.id);
                            } else {
                              setValue2("");
                            }
                            setOpen2(false);
                          }}
                        >
                          {d.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              value2 === d.id ? "opacity-100" : "opacity-0"
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
          <div className=" relative w-1/4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Cari Produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto max-h-[70vh] min-h-[70vh] bg-white relative">
          <Table className="w-full min-w-[1000px] bg-white">
            <TableHeader className="sticky top-0 bg-gray-100 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-left">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="overflow-y-auto max-h-[60vh]">
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="bg-white">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>

  )
}

export default TpModal
