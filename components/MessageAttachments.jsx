"use client"

import { FileText } from "lucide-react"

export default function MessageAttachments({ attachments }) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) =>
        a.fileType?.startsWith("image/") ? (
          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
            <img
              src={a.url}
              alt={a.fileName}
              className="h-32 w-auto rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity"
            />
          </a>
        ) : (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="max-w-[150px] truncate">{a.fileName}</span>
            <span className="text-zinc-400">
              {a.fileSize < 1024
                ? `${a.fileSize}B`
                : a.fileSize < 1024 * 1024
                  ? `${Math.round(a.fileSize / 1024)}KB`
                  : `${(a.fileSize / (1024 * 1024)).toFixed(1)}MB`}
            </span>
          </a>
        )
      )}
    </div>
  )
}
