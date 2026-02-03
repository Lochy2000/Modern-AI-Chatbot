"use client"

import { ExternalLink } from "lucide-react"

export default function SearchCitations({ results }) {
  if (!results || results.length === 0) return null

  return (
    <div className="mt-3 space-y-1.5">
      <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Sources</div>
      {results.map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <span className="font-medium text-blue-600 dark:text-blue-400 shrink-0">[{i + 1}]</span>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{r.title}</div>
            <div className="text-zinc-500 line-clamp-2 mt-0.5">{r.content}</div>
          </div>
          <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
        </a>
      ))}
    </div>
  )
}
