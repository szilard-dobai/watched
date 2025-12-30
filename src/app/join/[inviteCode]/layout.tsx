import type { Metadata } from "next"
import type { PropsWithChildren } from "react"

export const metadata: Metadata = {
  title: "Join List",
  description: "Join a shared watch list",
}

const JoinLayout = ({ children }: PropsWithChildren) => {
  return <>{children}</>
}

export default JoinLayout
