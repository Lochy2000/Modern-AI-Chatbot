"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Send, Loader2, Plus, Globe, X } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import FilePreviewStrip from "./FilePreviewStrip"
import { cls } from "./utils"

const Composer = forwardRef(function Composer(
  { onSend, busy, webSearchEnabled, setWebSearchEnabled },
  ref,
) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [pendingFiles, setPendingFiles] = useState([])
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 20
      const minHeight = 40

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.floor((scrollHeight - 16) / lineHeight))

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${minHeight + 11 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [],
  )

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    const newPending = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      uploading: false,
      uploaded: false,
      url: null,
    }))
    setPendingFiles((prev) => [...prev, ...newPending])
    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  function removePendingFile(index) {
    setPendingFiles((prev) => {
      const removed = prev[index]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSend() {
    if ((!value.trim() && pendingFiles.length === 0) || sending) return
    setSending(true)
    try {
      await onSend?.(value, pendingFiles.map((f) => f.file))
      setValue("")
      // Clean up preview URLs
      pendingFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      })
      setPendingFiles([])
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.length > 0 || pendingFiles.length > 0

  return (
    <div className="border-t border-zinc-200/60 p-4 dark:border-zinc-800">
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 transition-all duration-200",
          "max-w-3xl border-zinc-300 dark:border-zinc-700 p-3",
        )}
      >
        {webSearchEnabled && (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Globe className="h-3 w-3" />
              Web search enabled
              <button
                onClick={() => setWebSearchEnabled(false)}
                className="ml-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        <FilePreviewStrip files={pendingFiles} onRemove={removePendingFile} />

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left",
            )}
            style={{
              height: "auto",
              overflowY: lineCount > 12 ? "auto" : "hidden",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center justify-between mt-2">
          <ComposerActionsPopover
            onFileUpload={() => fileInputRef.current?.click()}
            onWebSearch={() => setWebSearchEnabled?.(!webSearchEnabled)}
          >
            <button
              className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
              title="Add attachment"
            >
              <Plus className="h-4 w-4" />
            </button>
          </ComposerActionsPopover>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSend}
              disabled={sending || busy || !hasContent}
              className={cls(
                "inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900",
                (sending || busy || !hasContent) && "opacity-50 cursor-not-allowed",
              )}
            >
              {sending || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Press{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        to send ·{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Shift
        </kbd>
        +
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        for newline
      </div>
    </div>
  )
})

export default Composer
