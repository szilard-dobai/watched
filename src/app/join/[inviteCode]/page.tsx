"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
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

  const [listName, setListName] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.push(`/login?redirect=/join/${inviteCode}`)
    }
  }, [session, isPending, router, inviteCode])

  useEffect(() => {
    const fetchListInfo = async () => {
      if (!session) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/lists/join?inviteCode=${inviteCode}`, {
          method: "GET",
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error ?? "Invalid invite link")
          return
        }

        const data = await response.json()
        setListName(data.name)
      } catch {
        setError("Failed to load list information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchListInfo()
  }, [session, inviteCode])

  const handleJoin = async () => {
    setIsJoining(true)
    setError("")

    try {
      const response = await fetch("/api/lists/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Failed to join list")
        return
      }

      router.push(`/lists/${data._id}`)
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsJoining(false)
    }
  }

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

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to Join</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
