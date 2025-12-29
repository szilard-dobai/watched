"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Upload } from "lucide-react"

interface MobileFabProps {
  onAddEntryClick: () => void
  onImportClick: () => void
}

export const MobileFab = ({ onAddEntryClick, onImportClick }: MobileFabProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded((prev) => !prev)
  }

  const handleAddEntryClick = () => {
    setIsExpanded(false)
    onAddEntryClick()
  }

  const handleImportClick = () => {
    setIsExpanded(false)
    onImportClick()
  }

  return (
    <div className="lg:hidden fixed bottom-6 right-4 flex flex-col items-end gap-3 z-40">
      {isExpanded && (
        <>
          <div className="flex items-center gap-2 me-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="bg-zinc-900 text-white text-sm px-3 py-1.5 rounded-full shadow-lg">
              Import CSV
            </span>
            <Button
              className="size-12 rounded-full shadow-lg"
              size="icon"
              variant="secondary"
              onClick={handleImportClick}
              aria-label="Import CSV"
            >
              <Upload className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 me-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="bg-zinc-900 text-white text-sm px-3 py-1.5 rounded-full shadow-lg">
              Add Entry
            </span>
            <Button
              className="size-12 rounded-full shadow-lg"
              size="icon"
              variant="secondary"
              onClick={handleAddEntryClick}
              aria-label="Add entry"
            >
              <Plus className="size-5" />
            </Button>
          </div>
        </>
      )}

      <Button
        className="size-14 rounded-full shadow-lg transition-transform duration-200"
        size="icon"
        onClick={handleToggle}
        aria-label={isExpanded ? "Close menu" : "Open menu"}
        aria-expanded={isExpanded}
      >
        {isExpanded ? <X className="size-6" /> : <Plus className="size-6" />}
      </Button>
    </div>
  )
}
