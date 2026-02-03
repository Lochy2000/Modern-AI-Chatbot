"use client"
import { Asterisk, MoreHorizontal, Menu, ChevronDown, Columns2 } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "./GhostIconButton"
import { cls } from "./utils"

export default function Header({
  createNewChat,
  sidebarCollapsed,
  setSidebarOpen,
  selectedModel,
  setSelectedModel,
  compareMode,
  setCompareMode,
  selectedModelsForCompare,
  setSelectedModelsForCompare,
  MODEL_MAP,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCompareDropdownOpen, setIsCompareDropdownOpen] = useState(false)

  const chatbots = [
    { name: "GPT-5", icon: "🤖", id: "openai/gpt-4o" },
    { name: "Claude Sonnet 4", icon: "🎭", id: "anthropic/claude-sonnet-4-20250514" },
    { name: "Gemini", icon: "💎", id: "google/gemini-2.0-flash-001" },
    { name: "Assistant", icon: <Asterisk className="h-4 w-4" />, id: "openai/gpt-4o-mini" },
  ]

  function toggleCompareModel(modelId) {
    setSelectedModelsForCompare((prev) => {
      if (prev.includes(modelId)) {
        if (prev.length <= 2) return prev // Minimum 2 models
        return prev.filter((m) => m !== modelId)
      }
      if (prev.length >= 4) return prev // Maximum 4 models
      return [...prev, modelId]
    })
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {!compareMode ? (
        <div className="hidden md:flex relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            {typeof chatbots.find((bot) => bot.name === selectedModel)?.icon === "string" ? (
              <span className="text-sm">{chatbots.find((bot) => bot.name === selectedModel)?.icon}</span>
            ) : (
              chatbots.find((bot) => bot.name === selectedModel)?.icon
            )}
            {selectedModel}
            <ChevronDown className="h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
              {chatbots.map((bot) => (
                <button
                  key={bot.name}
                  onClick={() => {
                    setSelectedModel(bot.name)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                >
                  {typeof bot.icon === "string" ? <span className="text-sm">{bot.icon}</span> : bot.icon}
                  {bot.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex relative">
          <button
            onClick={() => setIsCompareDropdownOpen(!isCompareDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
          >
            <Columns2 className="h-4 w-4" />
            Comparing {selectedModelsForCompare.length} models
            <ChevronDown className="h-4 w-4" />
          </button>

          {isCompareDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 p-2">
              <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase">Select 2-4 models</div>
              {chatbots.map((bot) => {
                const isSelected = selectedModelsForCompare.includes(bot.id)
                return (
                  <button
                    key={bot.id}
                    onClick={() => toggleCompareModel(bot.id)}
                    className={cls(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg",
                      isSelected
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                  >
                    <div
                      className={cls(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-zinc-300 dark:border-zinc-600",
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {typeof bot.icon === "string" ? <span className="text-sm">{bot.icon}</span> : bot.icon}
                    {bot.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => {
            setCompareMode(!compareMode)
            setIsCompareDropdownOpen(false)
          }}
          className={cls(
            "hidden md:inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
            compareMode
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
              : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800",
          )}
        >
          <Columns2 className="h-3.5 w-3.5" />
          Compare
        </button>
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
