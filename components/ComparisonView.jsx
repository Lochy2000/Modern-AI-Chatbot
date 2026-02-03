"use client"

import { useState } from "react"
import { cls } from "./utils"
import SearchCitations from "./SearchCitations"

// Map OpenRouter model IDs to display names
const MODEL_NAMES = {
  "openai/gpt-4o": "GPT-5",
  "anthropic/claude-sonnet-4-20250514": "Claude Sonnet 4",
  "google/gemini-2.0-flash-001": "Gemini",
  "openai/gpt-4o-mini": "Assistant",
}

export default function ComparisonView({ responses }) {
  const [activeTab, setActiveTab] = useState(0)

  if (!responses || responses.length === 0) return null

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {responses.map((r, i) => (
          <button
            key={r.modelId || r.model || i}
            onClick={() => setActiveTab(i)}
            className={cls(
              "flex-1 px-4 py-2.5 text-xs font-medium transition-colors",
              activeTab === i
                ? "bg-white dark:bg-zinc-900 border-b-2 border-blue-500 text-zinc-900 dark:text-zinc-100"
                : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            {MODEL_NAMES[r.modelId || r.model] || r.modelId || r.model || `Model ${i + 1}`}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="p-4">
        <div className="whitespace-pre-wrap text-sm">{responses[activeTab]?.content}</div>
        {responses[activeTab]?.metadata?.searchResults && (
          <SearchCitations results={responses[activeTab].metadata.searchResults} />
        )}
      </div>
    </div>
  )
}
