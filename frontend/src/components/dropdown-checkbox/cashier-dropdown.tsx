"use client"

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/utils"
import useSWR from "swr"

export function CashierDropdown() {
  const [selected, setSelected] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const API_URL = process.env.NEXT_PUBLIC_API_URL!
  const { data, error, isLoading } = useSWR(`/api/proxy/api/users/by_role/?role_ids=5`, fetcher);

  // Menangani status loading dan error
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Terjadi kesalahan saat memuat data.</p>;

  const toggleItem = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  // Filter data berdasarkan pencarian
  const filteredItems = Array.isArray(data)
  ? data.filter((item: { username: string }) =>
      item.username.toLowerCase().includes(search.toLowerCase())
    )
  : []

  const allFilteredSelected = filteredItems.every((item: { id: number}) =>
    selected.includes(item.id)
  )

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev =>
        prev.filter(id => !filteredItems.find((item: { id: number }) => item.id === id))
      )
    } else {
      setSelected(prev => [
        ...prev,
        ...filteredItems
          .filter((item: { id: number }) => !prev.includes(item.id))
          .map((item: { id: any }) => item.id),
      ])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-52 justify-between font-normal">
          {selected.length > 0 ? `${selected.length} selected` : "Pilih Member"}
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
        <ScrollArea className="h-40">
          {filteredItems.length > 0 ? (
            filteredItems.map((item: { id: number; username: string }) => (
              <label
                key={item.id}
                className="flex items-center space-x-2 py-1 px-2 hover:bg-muted rounded-md cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span>{item.username}</span>
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
