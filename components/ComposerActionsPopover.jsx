"use client"
import { useState } from "react"
import { Paperclip, Globe } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { toast } from "sonner"

export default function ComposerActionsPopover({ children, onFileUpload, onWebSearch }) {
  const [open, setOpen] = useState(false)

  const actions = [
    {
      icon: Paperclip,
      label: "Add photos & files",
      action: () => {
        if (onFileUpload) {
          onFileUpload()
        } else {
          toast.info("File uploads coming soon")
        }
      },
    },
    {
      icon: Globe,
      label: "Web search",
      action: () => {
        if (onWebSearch) {
          onWebSearch()
        } else {
          toast.info("Web search coming soon")
        }
      },
    },
  ]

  const handleAction = (action) => {
    action()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" side="top">
        <div className="p-3">
          <div className="space-y-1">
            {actions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <button
                  key={index}
                  onClick={() => handleAction(action.action)}
                  className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
