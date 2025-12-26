"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ListWithRole } from "@/types"

interface ListSelectorProps {
  lists: ListWithRole[]
  selectedListId: string | "all"
  onSelect: (listId: string | "all") => void
}

export const ListSelector = ({
  lists,
  selectedListId,
  onSelect,
}: ListSelectorProps) => {
  const selectedList = lists.find((l) => l._id === selectedListId)
  const displayName = selectedListId === "all" ? "All Lists" : selectedList?.name ?? "Select List"

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between sm:w-48"
        onClick={(e) => {
          const dropdown = e.currentTarget.nextElementSibling
          if (dropdown) {
            dropdown.classList.toggle("hidden")
          }
        }}
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>
      <div className="absolute left-0 top-full z-50 mt-1 hidden w-full rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 sm:w-48">
        <button
          onClick={() => {
            onSelect("all")
            document.querySelector(".hidden")?.classList.add("hidden")
          }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
            selectedListId === "all" ? "bg-zinc-100 dark:bg-zinc-800" : ""
          }`}
        >
          All Lists
        </button>
        {lists.map((list) => (
          <button
            key={list._id}
            onClick={() => {
              onSelect(list._id)
              document.querySelector(".hidden")?.classList.add("hidden")
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              selectedListId === list._id ? "bg-zinc-100 dark:bg-zinc-800" : ""
            }`}
          >
            {list.name}
          </button>
        ))}
      </div>
    </div>
  )
}
