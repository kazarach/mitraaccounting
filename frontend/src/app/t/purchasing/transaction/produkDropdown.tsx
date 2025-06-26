import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react';

import useSWR from 'swr';
import SyncLoader from 'react-spinners/SyncLoader';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type StockDropdownProps = {
    value: Stock | null;
    onChange: (stock: Stock | null) => void;
};

type Stock = {
    id: number;
    name: string;
    available_quantity: number;
    barcode: string;
    unit_name: string;
    supplier_name: string;
    category_name: string;
};


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const ProductDropdown: React.FC<StockDropdownProps> = ({ value, onChange }) => {
    const [open, setOpen] = React.useState(false);
    const { data = [], error, isLoading } = useSWR<Stock[]>(
        `/api/proxy/api/stock/`,
        fetcher
    );

    React.useEffect(() => {
        if (value === null && data.length > 0) {
            
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
                    className="w-full min-w-[250px] max-w-full justify-between font-normal"
                >
                    <span className="truncate max-w-[90%]">
                        {value ? `${value.name}` : 'Pilih Produk'}
                    </span>
                    <ChevronsUpDown className="opacity-50 ml-1 shrink-0" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-full min-w-[250px] p-0 border rounded-md">
                <Command>
                    <CommandInput placeholder="Pilih Produk" />
                    <CommandList>
                        <CommandEmpty>Produk Tidak Ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {data.map((stock) => (
                                <CommandItem
                                    key={stock.id}
                                    value={stock.name}
                                    data-value={stock.id}
                                    onSelect={() => {
                                        onChange(stock);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex justify-between w-full">
                                        <span className="truncate max-w-[250px]">{stock.name}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value?.id === stock.id ? "opacity-100" : "opacity-0"
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

export default ProductDropdown;
