"use client"

import { useState, useEffect } from "react"
import { Crown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ListRole } from "@/types"

interface Member {
  _id: string
  userId: string
  role: ListRole
  joinedAt: string
  name: string
  email: string
}

interface MemberListProps {
  listId: string
  currentUserRole: ListRole
  currentUserId: string
}

export const MemberList = ({
  listId,
  currentUserRole,
  currentUserId,
}: MemberListProps) => {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/lists/${listId}/members`)
        if (response.ok) {
          const data = await response.json()
          setMembers(data)
        }
      } catch {
        console.error("Failed to fetch members")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [listId])

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    try {
      const response = await fetch(`/api/lists/${listId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId))
      }
    } catch {
      console.error("Failed to remove member")
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading members...</p>
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Members ({members.length})
      </label>
      <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {members.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium dark:bg-zinc-800">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  {member.role === "owner" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{member.email}</span>
              </div>
            </div>
            {currentUserRole === "owner" &&
              member.userId !== currentUserId &&
              member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(member.userId)}
                  disabled={removingId === member.userId}
                  className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
          </div>
        ))}
      </div>
    </div>
  )
}
