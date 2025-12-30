import { Popcorn } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { UserMenu } from "../auth/user-menu";

const Header = ({ children }: PropsWithChildren) => {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
            <Popcorn className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold">Watched</h1>
            <p className="text-xs text-zinc-500">
              Track movies & TV shows you&apos;re watching together
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {children}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
