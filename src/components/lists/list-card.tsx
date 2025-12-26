"use client"

import Link from "next/link"
import { Users, Crown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ListWithRole } from "@/types"

interface ListCardProps {
  list: ListWithRole
}

export const ListCard = ({ list }: ListCardProps) => {
  return (
    <Link href={`/lists/${list._id}`}>
      <Card className="transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{list.name}</CardTitle>
            {list.role === "owner" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Owner
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <Users className="h-4 w-4" />
            <span>
              {list.memberCount} {list.memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
