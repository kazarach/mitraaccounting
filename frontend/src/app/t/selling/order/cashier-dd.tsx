import { fetcher } from '@/lib/utils';
import React, { useEffect } from 'react'

import useSWR from 'swr';
// import Loading from '../loading';
import SyncLoader from 'react-spinners/SyncLoader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';

type Cashier = {
    id: number
    username: string
}

interface CashierOrderDDProps {
  onChange?: (id: number | null, cashierData?: Cashier) => void;
}


const CashierOrderDD: React.FC<CashierOrderDDProps> = ({ onChange }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data, error, isLoading } = useSWR<Cashier>(
    `/api/proxy/api/users/me/`,
    fetcher
  );

  useEffect(() => {
    if (data && onChange) {
      onChange(data.id, data);
    }
  }, [data, onChange]);

  if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>;
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>;

  return (
    <div className="text-sm ">
      <Popover>
        <PopoverTrigger asChild>
          <Button disabled className='bg-white border-2 text-black h-[30px]'>
          <span className="font-medium text-black">{data?.username}</span>
          </Button>
        </PopoverTrigger>
      </Popover>
    </div>
  );
};

export default CashierOrderDD
