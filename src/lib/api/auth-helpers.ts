import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const getServerSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export const requireAuth = async () => {
  const session = await getServerSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
