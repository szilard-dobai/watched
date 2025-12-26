"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ListCard } from "@/components/lists/list-card"
import { CreateListModal } from "@/components/lists/create-list-modal"
import { useLists } from "@/hooks/use-lists"

const ListsPage = () => {
  const { lists, isLoading, createList } = useLists()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreateList = async (name: string) => {
    await createList(name)
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Lists</h1>
            <p className="text-sm text-zinc-500">
              Manage your shared watch lists
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New List
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-500">Loading lists...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <h3 className="mb-2 text-lg font-medium">No lists yet</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Create your first list to start tracking movies and TV shows.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <ListCard key={list._id} list={list} />
            ))}
          </div>
        )}
      </div>

      <CreateListModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateList}
      />
    </main>
  )
}

export default ListsPage
