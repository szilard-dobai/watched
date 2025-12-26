"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Settings, ArrowLeft } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { InviteLink } from "@/components/lists/invite-link"
import { EntryCard } from "@/components/dashboard/entry-card"
import { AddEntryModal } from "@/components/forms/add-entry-modal"
import { AddWatchModal } from "@/components/forms/add-watch-modal"
import { useListDetail } from "@/hooks/use-list-detail"
import { useEntries } from "@/hooks/use-entries"
import type { Entry, EntryFormData } from "@/types"

const ListPage = () => {
  const router = useRouter()
  const params = useParams()
  const listId = params.listId as string
  const { data: session } = useSession()

  const { list, isLoading: isListLoading, error } = useListDetail(listId)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [watchModalEntry, setWatchModalEntry] = useState<Entry | null>(null)
  const {
    entries,
    isLoading: isEntriesLoading,
    addEntry,
    addWatch,
    deleteEntry,
  } = useEntries(listId)

  useEffect(() => {
    if (error) {
      router.push("/lists")
    }
  }, [error, router])

  const handleAddEntry = async (data: EntryFormData) => {
    await addEntry(data)
  }

  const handleAddWatch = async (watchData: {
    startDate: string
    endDate?: string
    platform?: string
    notes?: string
  }) => {
    if (!watchModalEntry) return
    await addWatch(watchModalEntry._id, watchData)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return
    await deleteEntry(entryId)
  }

  if (isListLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </main>
    )
  }

  if (!list || !session) {
    return null
  }

  const getMostRecentWatch = (entry: Entry) => {
    if (!entry.watches.length) return null
    return entry.watches.reduce((latest, watch) =>
      new Date(watch.addedAt) > new Date(latest.addedAt) ? watch : latest
    )
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const aWatch = getMostRecentWatch(a)
    const bWatch = getMostRecentWatch(b)
    if (!aWatch && !bWatch) return 0
    if (!aWatch) return 1
    if (!bWatch) return -1
    return (
      new Date(bWatch.addedAt).getTime() - new Date(aWatch.addedAt).getTime()
    )
  })

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/lists"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lists
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{list.name}</h1>
              <p className="text-sm text-zinc-500">
                {list.memberCount} {list.memberCount === 1 ? "member" : "members"}{" "}
                • {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddEntryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
              {list.role === "owner" && (
                <Link href={`/lists/${listId}/settings`}>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <InviteLink inviteCode={list.inviteCode} />
        </div>

        {isEntriesLoading ? (
          <p className="text-zinc-500">Loading entries...</p>
        ) : sortedEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <h3 className="mb-2 text-lg font-medium">No entries yet</h3>
            <p className="mb-4 text-sm text-zinc-500">
              Add your first movie or TV show to this list.
            </p>
            <Button onClick={() => setIsAddEntryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Entry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedEntries.map((entry) => (
              <EntryCard
                key={entry._id}
                entry={entry}
                currentUserId={session.user.id}
                listRole={list.role}
                onAddWatch={setWatchModalEntry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        )}
      </div>

      <AddEntryModal
        open={isAddEntryOpen}
        onOpenChange={setIsAddEntryOpen}
        onSubmit={handleAddEntry}
        listId={listId}
      />

      {watchModalEntry && (
        <AddWatchModal
          open={!!watchModalEntry}
          onOpenChange={(open) => !open && setWatchModalEntry(null)}
          onSubmit={handleAddWatch}
          entry={watchModalEntry}
        />
      )}
    </main>
  )
}

export default ListPage
