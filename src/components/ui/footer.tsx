import { ThemeToggle } from "./theme-toggle"

export const Footer = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-4 py-6">
      <div className="mx-auto max-w-7xl px-4 flex justify-between items-center">
        <p className="text-sm font-mono text-zinc-500">
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/szilard-dobai/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity underline"
          >
            Szilard Dobai
          </a>
        </p>

        <ThemeToggle />
      </div>
    </footer>
  )
}
