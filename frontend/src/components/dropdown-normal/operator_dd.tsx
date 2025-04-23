import { cn, fetcher } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import React from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../ui/command';
import { Button } from '../ui/button';
import useSWR from 'swr';
import SyncLoader from 'react-spinners/SyncLoader';

type Operator = {
  id: number;
  username: string;
};

type OperatorDDProps = {
  onChange?: (id: number | null) => void; // Menambahkan prop untuk mengirim ID operator ke parent
};

const OperatorDD = ({ onChange }: OperatorDDProps) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<number | null>(null);

  const { data = [], error, isLoading } = useSWR<Operator[]>(
    'http://127.0.0.1:8000/api/users/by_role/?role_id=3',
    fetcher
  );

  // Handle loading state
  if (isLoading) return <SyncLoader color="#366cd6" size={5} />;
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>;

  // Handle operator selection
  const handleSelect = (username: string) => {
    const selectedOperator = data.find((op) => op.username === username);
    const selectedId = selectedOperator ? selectedOperator.id : null;
    setValue(selectedId);
    if (onChange) {
      onChange(selectedId); // Kirim ID operator ke parent jika onChange ada
    }
    setOpen(false);
  };

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
              : 'Pilih Operator'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 border rounded-md">
          <Command>
            <CommandInput placeholder="Pilih Operator" />
            <CommandList>
              <CommandEmpty>Operator Tidak Ditemukan.</CommandEmpty>
              <CommandGroup>
                {data.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={d.username}
                    onSelect={() => handleSelect(d.username)}
                  >
                    {d.username}
                    <Check
                      className={cn('ml-auto', value === d.id ? 'opacity-100' : 'opacity-0')}
                    />
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

export default OperatorDD;
