"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/utils"
import useSWR from "swr"

interface OperatorDropdownProps {
  onChange: (selectedIds: number[]) => void; // <<== Tambahkan props onChange
}

export function OperatorDropdown({ onChange }: OperatorDropdownProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data, error, isLoading } = useSWR(`/api/proxy/api/users/cashier_and_above/`, fetcher)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>

  const toggleItem = (id: number) => {
    setSelected(prev => {
      const newSelected = prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
      onChange(newSelected)  // <<== Panggil onChange setiap kali berubah
      return newSelected
    })
  }

  const filteredItems = Array.isArray(data)
    ? data.filter((item: { username: string }) =>
        item.username.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const allFilteredSelected = filteredItems.every((item: { id: number }) =>
    selected.includes(item.id)
  )

  const toggleSelectAll = () => {
    setSelected(prev => {
      let newSelected: number[]
      if (allFilteredSelected) {
        newSelected = prev.filter(id => !filteredItems.find((item: { id: number }) => item.id === id))
      } else {
        newSelected = [
          ...prev,
          ...filteredItems
            .filter((item: { id: number }) => !prev.includes(item.id))
            .map((item: { id: number }) => item.id),
        ]
      }
      onChange(newSelected) // <<== Update parent saat Select All / Unselect All
      return newSelected
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full h-[30px] justify-between font-normal">
          {selected.length > 0 ? `${selected.length} selected` : "Pilih Operator"}
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <Input
          placeholder="Cari nama..."
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
        </div>
        <ScrollArea className="h-64 ">
          {filteredItems.length > 0 ? (
            filteredItems.map((item: { id: number; username: string; role: { name: string } }) => (
              <label
                key={item.id}
                className="flex items-center space-x-2 py-1 px-2 hover:bg-muted rounded-md cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span>{item.username} ({item.role.name})</span>
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
