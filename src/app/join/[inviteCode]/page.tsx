"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useJoinList } from "@/hooks/use-join-list"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const JoinListPage = () => {
  const router = useRouter()
  const params = useParams()
  const inviteCode = params.inviteCode as string
  const { data: session, isPending } = useSession()

  const {
    listName,
    isLoading,
    error,
    join,
    isJoining,
    joinError,
  } = useJoinList(inviteCode, !isPending && !!session)

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?redirect=/join/${inviteCode}`)
    }
  }, [session, isPending, router, inviteCode])

  const handleJoin = async () => {
    const result = await join()
    if (result) {
      router.push(`/lists/${result._id}`)
    }
  }

  const displayError = error ?? joinError

  if (isPending || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-zinc-500">Loading...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (displayError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to Join</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">
              {displayError}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")} variant="outline">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join List</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a shared watch list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{listName}</p>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join List"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

export default JoinListPage
