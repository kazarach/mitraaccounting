import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useEffect } from 'react'

import { Command,CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
// import Loading from '@/components/ui/loading';
import SyncLoader from 'react-spinners/SyncLoader';
import useAuthGuard from '@/hooks/useAuthGuard';

type Customer = {
    id: number;
    name: string;
    price_category?: {
      id: number;
      name: string;
    };
  };   

type CustomerDDAPRProps = {
    value: number | null;
    onChange: (customer: Customer | null) => void;
  };

  const CustomerDDAPR: React.FC<CustomerDDAPRProps> = ({ value, onChange }) => {
    useAuthGuard();
    const [open, setOpen] = React.useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL!;
    const { data = [], error, isLoading } = useSWR<Customer[]>(
      `${API_URL}/api/customers/`,
      fetcher
    );

    useEffect(() => {
    if (data.length > 0 && value == null) {
      onChange(data[0]); // customer paling atas
    }
  }, [data, value, onChange]);
  
    if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>;
    if (error) return <p>Terjadi kesalahan saat memuat data.</p>;
  
    const selectedCustomer = data.find((c) => c.id === value);
    return (
        <div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[150px] h-[30px] justify-between font-normal cursor-pointer"
                    >
                        {selectedCustomer ? selectedCustomer.name : 'Pilih'}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 z-15 border rounded-md">
                    <Command>
                        <CommandInput placeholder="Cari Customer" />
                        <CommandList>
                            <CommandEmpty>Distributor Tidak Ditemukan.</CommandEmpty>
                            <CommandGroup>
                            {data.map((customer) => (
                                <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => {
                                    setOpen(false);
                                    onChange(customer); // Kirim seluruh objek customer ke parent
                                }}
                                >
                                {customer.name}
                                <Check
                                    className={cn(
                                    "ml-auto",
                                    value === customer.id ? "opacity-100" : "opacity-0"
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

export default CustomerDDAPR