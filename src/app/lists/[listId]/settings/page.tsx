"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InviteLink } from "@/components/lists/invite-link"
import { MemberList } from "@/components/lists/member-list"
import type { ListWithRole } from "@/types"

const ListSettingsPage = () => {
  const router = useRouter()
  const params = useParams()
  const listId = params.listId as string
  const { data: session } = useSession()

  const [list, setList] = useState<ListWithRole | null>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/lists/${listId}`)
        if (!response.ok) {
          router.push("/lists")
          return
        }
        const data = await response.json()
        if (data.role !== "owner") {
          router.push(`/lists/${listId}`)
          return
        }
        setList(data)
        setName(data.name)
      } catch {
        router.push("/lists")
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [listId, router])

  const handleSave = async () => {
    if (!name.trim() || name === list?.name) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (response.ok) {
        const updated = await response.json()
        setList((prev) => (prev ? { ...prev, name: updated.name } : null))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateInvite = async () => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateInviteCode: true }),
      })

      if (response.ok) {
        const updated = await response.json()
        setList((prev) =>
          prev ? { ...prev, inviteCode: updated.inviteCode } : null
        )
      }
    } catch {
      console.error("Failed to regenerate invite code")
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this list? This action cannot be undone."
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/lists")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </main>
    )
  }

  if (!list || !session) {
    return null
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/lists/${listId}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Link>

        <h1 className="mb-8 text-2xl font-bold">List Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Update your list name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  List Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim() || name === list.name}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite Link</CardTitle>
              <CardDescription>
                Share this link to invite others to your list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteLink
                inviteCode={list.inviteCode}
                onRegenerate={handleRegenerateInvite}
                showRegenerate
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage who has access to this list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberList
                listId={listId}
                currentUserRole={list.role}
                currentUserId={session.user.id}
              />
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this list and all its entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete List"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

export default ListSettingsPage
