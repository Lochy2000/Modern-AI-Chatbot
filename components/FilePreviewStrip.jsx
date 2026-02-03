"use client"

import { X, FileText } from "lucide-react"

export default function FilePreviewStrip({ files, onRemove }) {
  if (!files || files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {files.map((f, i) => (
        <div
          key={i}
          className="relative group flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
        >
          {f.previewUrl ? (
            <img
              src={f.previewUrl}
              alt={f.file.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <FileText className="h-5 w-5 text-zinc-400" />
          )}
          <span className="max-w-[120px] truncate">{f.file.name}</span>
          {f.uploading && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          )}
          <button
            onClick={() => onRemove(i)}
            className="ml-1 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
