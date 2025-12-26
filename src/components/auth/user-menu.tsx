"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, ChevronDown } from "lucide-react"
import { signOut, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export const UserMenu = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{session.user.name}</span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-zinc-500">{session.user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
