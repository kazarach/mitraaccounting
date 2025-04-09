"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"

const items = [
  { value: "1", label: "Distributor A" },
  { value: "2", label: "Distributor B" },
  { value: "3", label: "Distributor C" },
  { value: "4", label: "Distributor D" },
  { value: "5", label: "Distributor E" },
  { value: "6", label: "Distributor F" },
  { value: "7", label: "Distributor G" },
  { value: "8", label: "Distributor H" },
]

export function DistributorDropdown() {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const toggleItem = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  )

  const allFilteredSelected = filteredItems.every(item =>
    selected.includes(item.value)
  )

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Uncheck semua item yang terlihat
      setSelected(prev =>
        prev.filter(value => !filteredItems.find(item => item.value === value))
      )
    } else {
      // Tambahkan semua item yang terlihat (hindari duplikat)
      setSelected(prev => [
        ...prev,
        ...filteredItems
          .filter(item => !prev.includes(item.value))
          .map(item => item.value),
      ])
    }
  }

  const clearAll = () => {
    setSelected([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-52 justify-between font-normal">
          {selected.length > 0 ? `${selected.length} selected` : "Pilih Distributor"}
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
                key={item.value}
                className="flex items-center space-x-2 py-1 px-2 hover:bg-muted rounded-md cursor-pointer"
              >
                <Checkbox
                  checked={selected.includes(item.value)}
                  onCheckedChange={() => toggleItem(item.value)}
                />
                <span>{item.label}</span>
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
