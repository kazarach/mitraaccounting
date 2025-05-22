"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { fetcher } from "@/lib/utils"

type Supplier = {
  id: number
  name: string
}

export function CustomerDropdown2({ onChange }: { onChange: (ids: number[]) => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const { data: items = [], error, isLoading } = useSWR<Supplier[]>(
    `${API_URL}api/customers/`,
    fetcher
  )

  useEffect(() => {
      onChange(selected);
    }, [selected, onChange]);

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>

  const toggleItem = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const allFilteredSelected = filteredItems.every((item) =>
    selected.includes(item.id)
  )

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev =>
        prev.filter(id => !filteredItems.find(item => item.id === id))
      )
    } else {
      setSelected(prev => [
        ...prev,
        ...filteredItems
          .filter(item => !prev.includes(item.id))
          .map(item => item.id),
      ])
    }
  }

  const clearAll = () => {
    setSelected([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[150px] h-[30px] justify-between font-normal cursor-pointer">
          {selected.length > 0 ? `${selected.length} selected` : "Pilih Customer"}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <Input
          placeholder="Cari distributor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="flex justify-between items-center px-2 mb-1 text-sm">
          <button
            onClick={toggleSelectAll}
            className="text-primary hover:underline"
          >
            {allFilteredSelected ? "Unselect All" : "Select All"}
          </button>
          <button
            onClick={clearAll}
            className="text-destructive hover:underline"
          >
            Clear All
          </button>
        </div>
        <ScrollArea className="h-40">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <label
                key={item.id}
                className="flex items-center space-x-2 py-1 px-2 hover:bg-muted rounded-md cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span>{item.name}</span>
              </label>
            ))
          ) : (
            <div className="text-sm text-muted-foreground px-2 py-1">Tidak ditemukan</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
