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
import { SyncLoader } from "react-spinners"

type Bank = {
  id: number
  code: string
  name: string
  type: string | null
  cb: string | null
  active: boolean
  acc: {
    id: number
    name: string
  }
}

export function BankDDP({
  onChange
}: {
  onChange: (ids: number[]) => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data: items = [], error, isLoading } = useSWR<Bank[]>(
    `/api/proxy/api/banks/`,
    fetcher
  )

  useEffect(() => {
    onChange(selected)
  }, [selected, onChange])

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
        ...filteredItems.filter(item => !prev.includes(item.id)).map(item => item.id)
      ])
    }
  }

  const clearAll = () => {
    setSelected([])
  }

  if (isLoading) return <p><SyncLoader color="#366cd6" size={5} /></p>
  if (error) return <p>Terjadi kesalahan saat memuat data bank.</p>

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] h-[30px] justify-between font-normal">
          {selected.length > 0 ? `${selected.length} dipilih` : "Semua"}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 z-50 border rounded-md">
        <Input
          placeholder="Cari bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="flex justify-between items-center px-2 mb-1 text-sm">
          <button onClick={toggleSelectAll} className="text-primary hover:underline">
            {allFilteredSelected ? "Unselect All" : "Select All"}
          </button>
          <button onClick={clearAll} className="text-destructive hover:underline">
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