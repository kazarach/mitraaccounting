import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react'

import { Command,CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import SyncLoader from 'react-spinners/SyncLoader';

type Stock = {
  id: number;
  name: string;
};

interface StockDDProps {
  onChange: (stockId: number | null) => void;
}

const StockDD = ({ onChange }: StockDDProps) => {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState<number | null>(null)
    const API_URL = process.env.NEXT_PUBLIC_API_URL!;
    const { data = [], error, isLoading } = useSWR<Stock[]>(
        `/api/proxy/api/stock/`,
        fetcher
    )

    if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>
    if (error) return <p>Terjadi kesalahan saat memuat data.</p>
    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-auto h-[30px] justify-between font-normal"
                    >
                        {value !== null ? data.find((d) => d.id === value)?.name : 'Pilih Stok'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 border rounded-md z-20">
                    <Command>
                        <CommandInput placeholder="Pilih Stok" />
                        <CommandList>
                            <CommandEmpty>Stok Tidak Ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {data.map((d) => (
                                    <CommandItem
                                        key={d.id}
                                        value={d.name}
                                        data-value={d.id}
                                        onSelect={(label) => {
                                            const selected = data.find((item) => item.name === label);
                                            if (selected) {
                                                setValue(selected.id);
                                                onChange(selected.id);
                                            } else {
                                                setValue(null);
                                                onChange(null);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        {d.name}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                value === d.id ? "opacity-100" : "opacity-0"
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
    )
}

export default StockDD