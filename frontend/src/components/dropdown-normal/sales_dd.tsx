import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react'

import { Command,CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Button } from '../ui/button';
import useSWR from 'swr';
import Loading from '../loading';
import SyncLoader from 'react-spinners/SyncLoader';

type Operator = {
    id: number
    username: string
}

const SalesDD = () => {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState<number | null>(null)
    const { data = [], error, isLoading } = useSWR<Operator[]>(
        "http://127.0.0.1:8000/api/users/by_role/?role_id=4",
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
                        className="w-[200px] justify-between font-normal"
                    >
                        {value !== null
                            ? data.find((d) => d.id === value)?.username
                            : 'Pilih Sales'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 border rounded-md">
                    <Command>
                        <CommandInput placeholder="Pilih Sales" />
                        <CommandList>
                            <CommandEmpty>Distributor Tidak Ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {data.map((d) => (
                                    <CommandItem
                                        key={d.id}
                                        value={d.username}
                                        data-value={d.id}
                                        onSelect={(currentLabel: string) => {
                                            const selectedDistributor = data.find((dist) => dist.username === currentLabel);
                                            if (selectedDistributor) {
                                                setValue(selectedDistributor.id);
                                            } else {
                                                setValue(null);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        {d.username}
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

export default SalesDD
