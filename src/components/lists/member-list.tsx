"use client"

import { useMemo } from "react"
import { Crown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useListMembers } from "@/hooks/use-list-members"
import type { ListRole } from "@/types"

interface MemberListProps {
  listId: string
  currentUserRole: ListRole
  currentUserId: string
}

const ROLE_LABELS: Record<ListRole, string> = {
  owner: "Owner",
  member: "Member",
  viewer: "Viewer",
}

export const MemberList = ({
  listId,
  currentUserRole,
  currentUserId,
}: MemberListProps) => {
  const {
    members,
    isLoading,
    removeMember,
    removingUserId,
    updateMemberRole,
    updatingRoleUserId,
  } = useListMembers(listId)

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === "owner") return -1
      if (b.role === "owner") return 1
      if (a.userId === currentUserId) return -1
      if (b.userId === currentUserId) return 1
      return a.name.localeCompare(b.name)
    })
  }, [members, currentUserId])

  const handleRemove = async (userId: string) => {
    await removeMember(userId)
  }

  const handleRoleChange = async (userId: string, role: ListRole) => {
    await updateMemberRole(userId, role)
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading members...</p>
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Members ({members.length})</label>
      <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {sortedMembers.map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium dark:bg-zinc-800">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {member.name}
                  </span>
                  {member.role === "owner" && (
                    <Badge
                      variant="secondary"
                      className="flex shrink-0 items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      Owner
                    </Badge>
                  )}
                  {member.userId === currentUserId && (
                    <Badge variant="outline" className="shrink-0">
                      You
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-zinc-500 truncate block">
                  {member.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentUserRole === "owner" &&
                member.userId !== currentUserId &&
                member.role !== "owner" && (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.userId, value as ListRole)
                      }
                      disabled={updatingRoleUserId === member.userId}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          {ROLE_LABELS.member}
                        </SelectItem>
                        <SelectItem value="viewer">
                          {ROLE_LABELS.viewer}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(member.userId)}
                      disabled={removingUserId === member.userId}
                      className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              {currentUserRole !== "owner" && member.role !== "owner" && (
                <span className="text-xs text-zinc-500">
                  {ROLE_LABELS[member.role]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
