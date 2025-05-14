import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react';

import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import SyncLoader from 'react-spinners/SyncLoader';
import useAuthGuard from '@/hooks/useAuthGuard';

type Bank = {
  id: number;
  code: string;
  name: string;
  type: string | null;
  cb: string | null;
  active: boolean;
  acc: {
    id: number;
    name: string;
  };
};

type BankDDTSProps = {
  value: number | null;
  onChange: (bank: Bank | null) => void;
};

const BankDDTS: React.FC<BankDDTSProps> = ({ value, onChange }) => {
  useAuthGuard();
  const [open, setOpen] = React.useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data = [], error, isLoading } = useSWR<Bank[]>(`${API_URL}/api/banks/`, fetcher);

  if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>;
  if (error) return <p>Terjadi kesalahan saat memuat data bank.</p>;

  const selectedBank = data.find((b) => b.id === value);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between font-normal bg-white w-full rounded-none border-none"
          >
            {selectedBank ? selectedBank.name : 'Pilih Bank'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 z-15 border rounded-md">
          <Command>
            <CommandInput placeholder="Cari Bank..." />
            <CommandList>
              <CommandEmpty>Bank Tidak Ditemukan.</CommandEmpty>
              <CommandGroup>
                {data.map((bank) => (
                  <CommandItem
                    key={bank.id}
                    value={bank.name}
                    onSelect={() => {
                      setOpen(false);
                      onChange(bank);
                    }}
                  >
                    {bank.name}
                    <Check className={cn("ml-auto", value === bank.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BankDDTS;
