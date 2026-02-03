"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Calendar, LayoutGrid, MoreHorizontal, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"

// Helper to generate title from first user message (first ~25-30 chars, cut at word boundary)
function generateTitleFromMessage(message) {
  if (!message || typeof message !== "string") return "New Chat"

  // Clean up the message
  const cleaned = message.trim().replace(/\s+/g, " ")
  if (!cleaned) return "New Chat"

  // If message is short enough, use it directly
  if (cleaned.length <= 30) {
    return cleaned
  }

  // Find the last space before the 30 char limit to cut at word boundary
  const truncated = cleaned.slice(0, 30)
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSpace > 10) {
    return truncated.slice(0, lastSpace) + "..."
  }

  // If no good word boundary, just truncate
  return truncated + "..."
}

export default function AIAssistantUI() {
  const { data: session } = useSession()
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme")
    if (saved) return saved
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  // Model selection state (lifted from Header)
  const [selectedModel, setSelectedModel] = useState("GPT-5")

  // Web search state
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [selectedModelsForCompare, setSelectedModelsForCompare] = useState(["openai/gpt-4o", "anthropic/claude-sonnet-4-20250514"])

  // Map UI model names to OpenRouter model IDs
  const MODEL_MAP = {
    "GPT-5": "openai/gpt-4o",
    "Claude Sonnet 4": "anthropic/claude-sonnet-4-20250514",
    "Gemini": "google/gemini-2.0-flash-001",
    "Assistant": "openai/gpt-4o-mini",
  }

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations])

  // Fetch data from API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [conversationsRes, templatesRes, foldersRes] = await Promise.all([
          fetch("/api/conversations"),
          fetch("/api/templates"),
          fetch("/api/folders"),
        ])

        if (conversationsRes.ok) {
          const convs = await conversationsRes.json()
          setConversations(convs)
          // Auto-select first conversation, or create a new one if none exist
          if (convs.length > 0) {
            setSelectedId(convs[0].id)
          } else {
            await createNewChat()
          }
        } else {
          setError("Failed to load conversations")
        }

        if (templatesRes.ok) {
          const temps = await templatesRes.json()
          setTemplates(temps)
        }

        if (foldersRes.ok) {
          const folds = await foldersRes.json()
          setFolders(folds)
        }
      } catch (err) {
        toast.error("Failed to connect to server. Please try again.")
        setError("Failed to connect to server. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.id, 0]))
    for (const c of conversations) if (c.folderId && map[c.folderId] != null) map[c.folderId] += 1
    return map
  }, [conversations, folders])

  async function togglePin(id) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv) return

    // Optimistic update
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))

    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !conv.pinned }),
      })
    } catch (error) {
      toast.error("Failed to pin conversation")
      // Revert on error
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: conv.pinned } : c)))
    }
  }

  async function createNewChat() {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setConversations((prev) => [newConversation, ...prev])
        setSelectedId(newConversation.id)
        setSidebarOpen(false)
      }
    } catch (error) {
      toast.error("Failed to create new chat")
    }
  }

  async function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        const newFolder = await response.json()
        setFolders((prev) => [...prev, newFolder])
      }
    } catch (error) {
      toast.error("Failed to create folder")
    }
  }

  async function deleteFolder(folderId) {
    // Optimistic update
    const prevFolders = folders
    const prevConversations = conversations
    setFolders((prev) => prev.filter((f) => f.id !== folderId))
    setConversations((prev) => prev.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c)))

    try {
      const response = await fetch(`/api/folders/${folderId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete folder")
    } catch (error) {
      toast.error("Failed to delete folder")
      setFolders(prevFolders)
      setConversations(prevConversations)
    }
  }

  async function renameFolder(folderId, newName) {
    // Optimistic update
    const prevFolders = folders
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)))

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      if (!response.ok) throw new Error("Failed to rename folder")
    } catch (error) {
      toast.error("Failed to rename folder")
      setFolders(prevFolders)
    }
  }

  async function moveToFolder(conversationId, folderId) {
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, folderId } : c))
    )

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      })

      if (!response.ok) {
        throw new Error("Failed to move conversation")
      }
    } catch (error) {
      toast.error("Failed to move conversation")
      // Revert on error - refetch to get actual state
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const convs = await res.json()
        setConversations(convs)
      }
    }
  }

  async function uploadFiles(files) {
    const uploaded = []
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        uploaded.push(await res.json())
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || `Failed to upload ${file.name}`)
      }
    }
    return uploaded
  }

  async function sendMessage(convId, content, files = []) {
    if (!content.trim() && files.length === 0) return

    const now = new Date().toISOString()
    const userMsgId = Math.random().toString(36).slice(2)
    const userMsg = { id: userMsgId, role: "user", content, timestamp: now, attachments: [] }

    // Get conversation messages BEFORE optimistic update for AI context
    const conv = conversations.find((c) => c.id === convId)
    const previousMessages = conv?.messages || []

    // Optimistically add user message to UI
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    try {
      // Upload files if any
      let uploadedAttachments = []
      if (files.length > 0) {
        uploadedAttachments = await uploadFiles(files)
        // Update optimistic message with attachment previews
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === userMsgId ? { ...m, attachments: uploadedAttachments } : m
              ),
            }
          }),
        )
      }

      // Save user message to database (with attachments)
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          role: "user",
          content,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }),
      })

      // Web search enrichment
      let searchResults = null
      let enrichedContent = content
      if (webSearchEnabled && content.trim()) {
        try {
          const searchRes = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: content }),
          })
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            searchResults = searchData.results
            // Build enriched prompt with search context
            const sourcesText = searchData.results
              .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
              .join("\n\n")
            enrichedContent = `[Web Search Results for "${content}"]\n${sourcesText}\n\nBased on these search results, answer the following question:\n${content}`
          }
        } catch {
          toast.error("Web search failed, sending without search results")
        }
        setWebSearchEnabled(false)
      }

      // Handle compare mode
      if (compareMode) {
        await sendCompareMessage(convId, previousMessages, userMsg, enrichedContent, searchResults)
        return
      }

      // Build messages for AI context
      const allMessages = [...previousMessages, { ...userMsg, content: enrichedContent }].map((m) => {
        // Support multimodal messages (images)
        const imageAttachments = (m.id === userMsgId ? uploadedAttachments : m.attachments || [])
          .filter((a) => a.fileType?.startsWith("image/"))

        if (imageAttachments.length > 0) {
          return {
            role: m.role,
            content: [
              { type: "text", text: m.id === userMsgId ? enrichedContent : m.content },
              ...imageAttachments.map((a) => ({
                type: "image_url",
                image_url: { url: a.url },
              })),
            ],
          }
        }
        return {
          role: m.role,
          content: m.id === userMsgId ? enrichedContent : m.content,
        }
      })

      // Call AI API with streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, model: MODEL_MAP[selectedModel] }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      const assistantMsgId = Math.random().toString(36).slice(2)

      // Initialize assistant message with model info and search results
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const asstMsg = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString(),
            model: selectedModel,
            metadata: searchResults ? { searchResults } : undefined,
          }
          return {
            ...c,
            messages: [...(c.messages || []), asstMsg],
          }
        }),
      )

      setIsThinking(false)
      setThinkingConvId(null)

      // Stream the response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                assistantContent += delta
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== convId) return c
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                      ),
                      preview: assistantContent.slice(0, 80),
                    }
                  }),
                )
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      // Save assistant message to database
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          role: "assistant",
          content: assistantContent,
          metadata: searchResults ? { searchResults } : undefined,
        }),
      })

      // Auto-generate title if this is the first exchange
      const currentConv = conversations.find((c) => c.id === convId)
      if (currentConv?.title === "New Chat" && content) {
        const newTitle = generateTitleFromMessage(content)
        if (newTitle !== "New Chat") {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
          )
          fetch(`/api/conversations/${convId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          }).catch(() => toast.error("Failed to update conversation title"))
        }
      }
    } catch (error) {
      toast.error("Failed to get AI response. Please try again.")
      setIsThinking(false)
      setThinkingConvId(null)

      const errorMsg = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          return {
            ...c,
            messages: [...(c.messages || []), errorMsg],
          }
        }),
      )
    }
  }

  async function sendCompareMessage(convId, previousMessages, userMsg, enrichedContent, searchResults) {
    try {
      const allMessages = [...previousMessages, { ...userMsg, content: enrichedContent }].map((m) => ({
        role: m.role,
        content: m.id === userMsg.id ? enrichedContent : m.content,
      }))

      const response = await fetch("/api/chat/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, models: selectedModelsForCompare }),
      })

      if (!response.ok) throw new Error("Comparison failed")

      const results = await response.json()
      const comparisonGroupId = Math.random().toString(36).slice(2)

      setIsThinking(false)
      setThinkingConvId(null)

      // Add all comparison responses to UI
      const comparisonMsgs = results.map((r) => ({
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: r.content,
        model: r.model,
        modelId: r.model,
        comparisonGroupId,
        metadata: searchResults ? { searchResults } : undefined,
        timestamp: new Date().toISOString(),
      }))

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          return {
            ...c,
            messages: [...(c.messages || []), ...comparisonMsgs],
            preview: results[0]?.content?.slice(0, 80) || c.preview,
          }
        }),
      )

      // Save comparison messages to database
      for (const msg of comparisonMsgs) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            role: "assistant",
            content: msg.content,
            modelId: msg.modelId,
            comparisonGroupId,
            metadata: searchResults ? { searchResults } : undefined,
          }),
        })
      }

      // Auto-generate title
      const currentConv = conversations.find((c) => c.id === convId)
      if (currentConv?.title === "New Chat" && userMsg.content) {
        const newTitle = generateTitleFromMessage(userMsg.content)
        if (newTitle !== "New Chat") {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
          )
          fetch(`/api/conversations/${convId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          }).catch(() => {})
        }
      }
    } catch (error) {
      toast.error("Model comparison failed. Please try again.")
      setIsThinking(false)
      setThinkingConvId(null)
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500">Loading your conversations...</span>
        </div>
      </div>
    )
  }

  if (error && conversations.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm text-zinc-500">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1400px]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
          user={session?.user}
          onMoveToFolder={moveToFolder}
          onDeleteFolder={deleteFolder}
          onRenameFolder={renameFolder}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            selectedModelsForCompare={selectedModelsForCompare}
            setSelectedModelsForCompare={setSelectedModelsForCompare}
            MODEL_MAP={MODEL_MAP}
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onSend={(content, files) => selected && sendMessage(selected.id, content, files)}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            user={session?.user}
            webSearchEnabled={webSearchEnabled}
            setWebSearchEnabled={setWebSearchEnabled}
          />
        </main>
      </div>
    </div>
  )
}
