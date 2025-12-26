"use client"

import { useState } from "react"
import { Copy, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InviteLinkProps {
  inviteCode: string
  onRegenerate?: () => Promise<void>
  showRegenerate?: boolean
}

export const InviteLink = ({
  inviteCode,
  onRegenerate,
  showRegenerate = false,
}: InviteLinkProps) => {
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Invite Link</label>
      <div className="flex gap-2">
        <Input value={inviteUrl} readOnly className="font-mono text-sm" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        {showRegenerate && onRegenerate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Generate new invite link"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
          </Button>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        Share this link with others to invite them to your list.
      </p>
    </div>
  )
}
