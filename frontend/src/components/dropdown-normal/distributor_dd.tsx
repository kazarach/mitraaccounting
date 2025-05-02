import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react';

import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Button } from '../ui/button';
import useSWR from 'swr';
import Loading from '../loading';
import SyncLoader from 'react-spinners/SyncLoader';

type DistributorDDProps = {
    value: number | null;
    onChange: (val: number | null) => void;
};

type Supplier = {
    id: number
    name: string
}

const DistributorDD: React.FC<DistributorDDProps> = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const { data = [], error, isLoading } = useSWR<Supplier[]>(
        "http://100.82.207.117:8000/api/suppliers/",
        fetcher
    );

    // Set the default distributor to the first one if value is null
    React.useEffect(() => {
        if (value === null && data.length > 0) {
            onChange(data[0].id);
        }
    }, [data, value, onChange]);

    if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>;
    if (error) return <p>Terjadi kesalahan saat memuat data.</p>;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between font-normal"
                >
                    {value !== null
                        ? data.find((d) => d.id === value)?.name
                        : 'Pilih Distributor'}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 border rounded-md">
                <Command>
                    <CommandInput placeholder="Pilih Distributor" />
                    <CommandList>
                        <CommandEmpty>Distributor Tidak Ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {data.map((d) => (
                                <CommandItem
                                    key={d.id}
                                    value={d.name}
                                    data-value={d.id}
                                    onSelect={() => {
                                        onChange(d.id);
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
    );
};

export default DistributorDD;
