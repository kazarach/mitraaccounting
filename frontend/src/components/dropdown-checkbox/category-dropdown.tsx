import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  {
    id: "1",
    name: "Baju",
    subcategories: [
      { id: "1-1", name: "Edwin" },
      { id: "1-2", name: "Juan" },
      { id: "1-3", name: "Rizky" },
    ],
  },
  {
    id: "2",
    name: "Celana",
    subcategories: [
      { id: "2-1", name: "Sugeng" },
      { id: "2-2", name: "Tresno" },
    ],
  },
];

export function CategoryDropdown() {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mainCategoryChecked, setMainCategoryChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const filteredItems = categories.map((category) => ({
    ...category,
    subcategories: category.subcategories.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  const allFilteredSelected = filteredItems.every((category) =>
    category.subcategories.every((subcategory) => selected.includes(subcategory.id))
  );

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) =>
        prev.filter(
          (id) =>
            !filteredItems.some((category) =>
              category.subcategories.find((subcategory) => subcategory.id === id)
            )
        )
      );
    } else {
      setSelected((prev) => [
        ...prev,
        ...filteredItems
          .flatMap((category) => category.subcategories)
          .filter((item) => !prev.includes(item.id))
          .map((item) => item.id),
      ]);
    }
  };

  const toggleCollapse = (categoryId: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleCategoryCheckboxChange = (categoryId: string) => {
    const isChecked = !mainCategoryChecked[categoryId];
    setMainCategoryChecked((prev) => ({ ...prev, [categoryId]: isChecked }));

    if (isChecked) {
      setSelected((prev) => [
        ...prev,
        ...categories
          .find((category) => category.id === categoryId)
          ?.subcategories.map((subcategory) => subcategory.id) || [],
      ]);
    } else {
      setSelected((prev) =>
        prev.filter(
          (id) =>
            !categories
              .find((category) => category.id === categoryId)
              ?.subcategories.some((subcategory) => subcategory.id === id)
        )
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-52 justify-between font-normal">
          {selected.length > 0 ? `${selected.length} selected` : "Semua"}
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
            filteredItems.map((category) => (
              <div key={category.id}>
                <div className="flex items-center space-x-2 py-1 px-2 cursor-pointer">
                  {/* Checkbox on the left */}
                  <Checkbox
                    checked={mainCategoryChecked[category.id] || false}
                    onCheckedChange={() => handleCategoryCheckboxChange(category.id)}
                  />
                  {/* Category name in the center */}
                  <span className="flex-grow">{category.name}</span>
                  {/* Chevron to the far right */}
                  <div onClick={() => toggleCollapse(category.id)}>
                    {collapsed[category.id] ? <ChevronDown /> : <ChevronRight />}
                  </div>
                </div>
                {collapsed[category.id] === false ? null : (
                  <div className="pl-4">
                    {category.subcategories.map((item) => (
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
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground px-2 py-1">Tidak ditemukan</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
